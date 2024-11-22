import { ethers } from 'ethers';
import { allNetworks, type EIP1193Provider } from '@0xsequence/network';
import { getAddress, TransactionRejectedRpcError } from 'viem';

import { ProviderTransport } from './ProviderTransport.js';
import { normalizeChainId } from './utils.js';

export class SequenceWaasTransportProvider
  extends ethers.AbstractProvider
  implements EIP1193Provider
{
  jsonRpcProvider: ethers.JsonRpcProvider;
  currentNetwork: ethers.Network;

  transport: ProviderTransport;

  constructor(
    public projectAccessKey: string,
    public walletUrl: string,
    public initialChainId: number,
    public nodesUrl: string,
  ) {
    super(initialChainId);

    const initialChainName = allNetworks.find(
      (n) => n.chainId === initialChainId,
    )?.name;
    const initialJsonRpcProvider = new ethers.JsonRpcProvider(
      `${nodesUrl}/${initialChainName}/${projectAccessKey}`,
    );

    this.transport = new ProviderTransport(walletUrl);
    this.jsonRpcProvider = initialJsonRpcProvider;
    this.currentNetwork = ethers.Network.from(initialChainId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request({ method, params }: { method: string; params?: any[] }) {
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
      const chainId = normalizeChainId(params?.[0].chainId);

      const networkName = allNetworks.find((n) => n.chainId === chainId)?.name;
      const jsonRpcProvider = new ethers.JsonRpcProvider(
        `${this.nodesUrl}/${networkName}/${this.projectAccessKey}`,
      );

      this.jsonRpcProvider = jsonRpcProvider;
      this.currentNetwork = ethers.Network.from(chainId);

      return null;
    }

    if (method === 'eth_chainId') {
      return ethers.toQuantity(this.currentNetwork.chainId);
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
          params,
          this.getChainId(),
        );

        if (response.code === 'transactionFailed') {
          // Failed
          throw new TransactionRejectedRpcError(
            new Error(`Unable to send transaction: ${response.data.error}`),
          );
        }

        if (response.code === 'transactionReceipt') {
          // Success
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
          params,
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

    return await this.jsonRpcProvider.send(method, params ?? []);
  }

  override async getTransaction(txHash: string) {
    return await this.jsonRpcProvider.getTransaction(txHash);
  }

  detectNetwork(): Promise<ethers.Network> {
    return Promise.resolve(this.currentNetwork);
  }

  getChainId() {
    return Number(this.currentNetwork.chainId);
  }

  disconnect() {
    this.transport.disconnect();
  }
}
