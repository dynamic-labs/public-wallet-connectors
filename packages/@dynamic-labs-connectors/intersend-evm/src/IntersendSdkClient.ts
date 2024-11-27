import { createWalletClient, custom, type WalletClient } from 'viem';
import { polygon } from 'viem/chains';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { type IEthereum } from '@dynamic-labs/ethereum';
import { EventEmitter } from 'events';

interface IntersendInfo {
  address: string;
  chainId: number;
}

// Create a proper provider type that extends IEthereum
class IntersendProvider extends EventEmitter implements IEthereum {
  public readonly isIntersend = true;
  public readonly selectedAddress: string | null = null;
  public readonly providers?: object[];

  constructor(private intersendInfo?: IntersendInfo) {
    super();
    this.selectedAddress = intersendInfo?.address || null;
  }

  //@ts-ignore
  async request<T extends string>(params: { method: T; params?: any[] }): Promise<T extends "eth_requestAccounts" ? [string] : any> {
    const { method, params: methodParams = [] } = params;
    const requestId = `${Date.now()}-${Math.random()}`;

    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [this.intersendInfo?.address] as any;

      case 'eth_chainId':
        return `0x${this.intersendInfo?.chainId.toString(16)}` as any;

      case 'eth_sendTransaction':
        return new Promise((resolve) => {
          //@ts-ignore
          IntersendSdkClient.pendingRequests.set(requestId, resolve);
          window.parent.postMessage({
            type: 'TRANSACTION_REQUEST',
            payload: { params: methodParams[0] },
            requestId
          }, '*');
        });

      case 'personal_sign':
      case 'eth_sign':
        return new Promise((resolve) => {
          //@ts-ignore
          IntersendSdkClient.pendingRequests.set(requestId, resolve);
          window.parent.postMessage({
            type: 'SIGN_MESSAGE_REQUEST',
            payload: { message: methodParams[0] },
            requestId
          }, '*');
        });

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
}

export class IntersendSdkClient {
  static isInitialized = false;
  static provider: IntersendProvider;
  static walletClient: WalletClient;
  static intersendInfo: IntersendInfo | undefined;
  private static pendingRequests = new Map<string, (value: any) => void>();

  private constructor() {
    throw new Error('IntersendSdkClient is not instantiable');
  }

  static init = async () => {
    if (IntersendSdkClient.isInitialized) {
      return;
    }

    IntersendSdkClient.isInitialized = true;
    logger.debug('[IntersendSdkClient] initializing sdk');

    // Setup message listener for communication with parent frame
    window.addEventListener('message', IntersendSdkClient.handleMessage);

    // Request initial connection info from parent
    window.parent.postMessage({ type: 'INTERSEND_CONNECT_REQUEST' }, '*');

    // Wait for connection response
    IntersendSdkClient.intersendInfo = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(undefined), 1000);
      
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'INTERSEND_CONNECT_RESPONSE') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(event.data.payload);
        }
      };

      window.addEventListener('message', handler);
    });

    if (!IntersendSdkClient.intersendInfo) {
      logger.debug('[IntersendSdkClient] unable to load intersend data');
      return;
    }

    logger.debug('[IntersendSdkClient] initializing provider');

    // Create provider instance
    IntersendSdkClient.provider = new IntersendProvider(IntersendSdkClient.intersendInfo);

    // Initialize viem wallet client
    IntersendSdkClient.walletClient = createWalletClient({
      chain: polygon,
      transport: custom(IntersendSdkClient.provider)
    });

    // Announce wallet following EIP-6963
    IntersendSdkClient.announceProvider();

    logger.debug('[IntersendSdkClient] provider initialized');
  };

  private static handleMessage = (event: MessageEvent) => {
    const { type, payload, requestId } = event.data;
    
    switch (type) {
      case 'TRANSACTION_RESPONSE':
      case 'SIGN_MESSAGE_RESPONSE':
        const pendingResolve = IntersendSdkClient.pendingRequests.get(requestId);
        if (pendingResolve) {
          pendingResolve(payload);
          IntersendSdkClient.pendingRequests.delete(requestId);
        }
        break;
    }
  };

  // Implement EIP-6963 announcement
  private static announceProvider() {
    const info = {
      uuid: 'intersend-wallet-' + crypto.randomUUID(),
      name: 'Intersend Wallet',
      icon: 'data:image/svg+xml;base64,...', // Your wallet icon
      rdns: 'com.intersend.wallet'
    };

    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info,
          provider: IntersendSdkClient.provider
        }
      })
    );
  }

  static getAddress = () => {
    return IntersendSdkClient.intersendInfo?.address;
  };

  static getProvider = () => {
    return IntersendSdkClient.provider;
  };

  static getWalletClient = () => {
    return IntersendSdkClient.walletClient;
  };
}