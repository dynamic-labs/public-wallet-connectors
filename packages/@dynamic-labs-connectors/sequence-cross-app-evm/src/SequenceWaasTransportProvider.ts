import {
  createPublicClient,
  getAddress,
  TransactionRejectedRpcError,
  type PublicClient,
  toHex,
  type Hash,
  type Transaction,
  http,
} from 'viem';

import { ProviderTransport } from './ProviderTransport.js';
import { networks } from './networks.js';
import { normalizeChainId } from './utils.js';

type EventType = 'chainChanged';

type EventCallback = (args: unknown) => void;

export interface EIP1193Provider {
  request(args: {
    method: string;
    params?: readonly unknown[];
  }): Promise<unknown>;
  on(eventName: EventType, callback: EventCallback): void;
  removeListener(eventName: EventType, callback: EventCallback): void;
  emit(eventName: EventType, args: unknown): void;
}

export class SequenceWaasTransportProvider implements EIP1193Provider {
  private eventListeners: Map<EventType, Set<EventCallback>> = new Map();
  publicClient: PublicClient;
  currentChainId: number;
  transport: ProviderTransport;

  constructor(
    public projectAccessKey: string,
    public walletUrl: string,
    public initialChainId: number,
    public nodesUrl: string,
  ) {
    const network = Object.values(networks).find(
      (network) => network.chainId === initialChainId && !network.deprecated,
    );

    if (!network) {
      throw new Error(`Unsupported chain ID: ${initialChainId}`);
    }

    this.publicClient = createPublicClient({
      transport: http(`${nodesUrl}/${network.name}/${projectAccessKey}`),
    });

    this.transport = new ProviderTransport(walletUrl);
    this.currentChainId = initialChainId;
  }

  async request({
    method,
    params,
  }: {
    method: string;
    params?: readonly unknown[];
  }) {
    if (method === 'eth_requestAccounts') {
      let walletAddress = this.transport.getWalletAddress();
      if (!walletAddress) {
        try {
          const res = await this.transport.connect();
          walletAddress = res.walletAddress;
        } catch (e) {
          console.log(e);
          throw e;
        }
      }
      const account = getAddress(walletAddress);
      return [account];
    }

    if (method === 'wallet_switchEthereumChain') {
      const param = params?.[0] as { chainId: string };
      const chainId = normalizeChainId(param.chainId);
      const network = Object.values(networks).find(
        (network) => network.chainId === chainId && !network.deprecated,
      );

      if (!network) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      try {
        this.publicClient = createPublicClient({
          transport: http(
            `${this.nodesUrl}/${network.name}/${this.projectAccessKey}`,
          ),
        });
        this.currentChainId = chainId;
        this.emitChainChanged(chainId);

        return null;
      } catch (error) {
        console.error('[Debug] Chain switch failed:', error);
        throw error;
      }
    }

    if (method === 'eth_chainId') {
      return toHex(this.currentChainId);
    }

    if (method === 'eth_accounts') {
      const address = this.transport.getWalletAddress();
      if (!address) {
        return [];
      }
      const account = getAddress(address);
      return [account];
    }

    if (method === 'eth_sendTransaction') {
      if (!params) {
        throw new Error('No params');
      }

      try {
        const response = await this.transport.sendRequest(
          method,
          Array.from(params),
          this.getChainId(),
        );

        if (response.code === 'transactionFailed') {
          throw new TransactionRejectedRpcError(
            new Error(`Unable to send transaction: ${response.data.error}`),
          );
        }

        if (response.code === 'transactionReceipt') {
          const { txHash } = response.data;
          return txHash;
        }
      } catch (e) {
        console.log('error in sendTransaction', e);
        throw new TransactionRejectedRpcError(
          new Error(`Unable to send transaction: wallet window was closed.`),
        );
      }
    }

    if (
      method === 'eth_sign' ||
      method === 'eth_signTypedData' ||
      method === 'eth_signTypedData_v4' ||
      method === 'personal_sign'
    ) {
      if (!params) {
        throw new Error('No params');
      }
      try {
        const response = await this.transport.sendRequest(
          method,
          Array.from(params),
          this.getChainId(),
        );

        return response.data.signature;
      } catch (e) {
        console.log('error in sign', e);
        throw new TransactionRejectedRpcError(
          new Error(`Unable to sign: wallet window was closed.`),
        );
      }
    }

    // For all other RPC methods, forward to the public client
    return await this.publicClient.request({
      method: method as Parameters<PublicClient['request']>[0]['method'],
      params: params as Parameters<PublicClient['request']>[0]['params'],
    });
  }

  async getTransaction(txHash: Hash): Promise<Transaction | null> {
    return await this.publicClient.getTransaction({ hash: txHash });
  }

  getChainId() {
    return this.currentChainId;
  }

  disconnect() {
    this.transport.disconnect();
  }

  // EIP-1193 Event Methods
  on(eventName: EventType, callback: EventCallback): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)?.add(callback);
  }

  removeListener(eventName: EventType, callback: EventCallback): void {
    this.eventListeners.get(eventName)?.delete(callback);
    if (this.eventListeners.get(eventName)?.size === 0) {
      this.eventListeners.delete(eventName);
    }
  }

  emit(eventName: EventType, args: unknown): void {
    this.eventListeners.get(eventName)?.forEach((callback) => {
      try {
        callback(args);
      } catch (error) {
        console.error(`Error in ${eventName} event handler:`, error);
      }
    });
  }

  private emitChainChanged(chainId: number): void {
    this.emit('chainChanged', toHex(chainId));
  }
}
