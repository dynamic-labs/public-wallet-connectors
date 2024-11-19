import { logger } from '@dynamic-labs/wallet-connector-core';
import { type IEthereum } from '@dynamic-labs/ethereum';

export class IntersendSdkClient {
  static isInitialized = false;
  static provider: IEthereum;
  static address: string | undefined;

  private constructor() {
    throw new Error('IntersendSdkClient is not instantiable');
  }

  static init = async () => {
    if (IntersendSdkClient.isInitialized) {
      return;
    }

    logger.debug('[IntersendSdkClient] initializing sdk');

    IntersendSdkClient.provider = IntersendSdkClient.createProvider();
    
    // Request initial wallet info
    window.parent.postMessage({
      type: 'REQUEST_WALLET_INFO',
      id: Date.now().toString()
    }, '*');

    // Setup message handler for wallet info
    await new Promise<void>((resolve) => {
      const handleWalletInfo = (event: MessageEvent) => {
        const { type, payload } = event.data || {};
        if (type === 'WALLET_INFO' && payload?.address) {
          IntersendSdkClient.address = payload.address;
          window.removeEventListener('message', handleWalletInfo);
          resolve();
        }
      };

      window.addEventListener('message', handleWalletInfo);
    });

    IntersendSdkClient.isInitialized = true;
    logger.debug('[IntersendSdkClient] sdk initialized');
  };

  private static createProvider(): IEthereum {
    const provider: IEthereum = {
      isMetaMask: false,
      isIntersend: true,
      isSafe: true,
      isPortability: true,

      //@ts-ignore
      request: async ({ method, params }) => {
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [IntersendSdkClient.address];

          case 'eth_chainId':
            return '0x89'; // Default to Polygon

          case 'personal_sign':
          case 'eth_sign':
          case 'eth_signTypedData':
          case 'eth_signTypedData_v4':
            return new Promise((resolve, reject) => {
              const messageId = Date.now().toString();
              
              const handleSignatureResponse = (event: MessageEvent) => {
                //@ts-ignore
                const { type, payload, id, error } = event.data || {};
                if (id === messageId) {
                  window.removeEventListener('message', handleSignatureResponse);
                  if (error) reject(new Error(error));
                  else resolve(payload.signature);
                }
              };

              window.addEventListener('message', handleSignatureResponse);
              window.parent.postMessage({
                type: 'SIGNATURE_REQUEST',
                payload: { method, params, address: IntersendSdkClient.address },
                id: messageId
              }, '*');
            });

          default:
            return new Promise((resolve, reject) => {
              const messageId = Date.now().toString();
              
              const handleResponse = (event: MessageEvent) => {
                //@ts-ignore
                const { type, payload, id, error } = event.data || {};
                if (id === messageId) {
                  window.removeEventListener('message', handleResponse);
                  if (error) reject(new Error(error));
                  else resolve(payload);
                }
              };

              window.addEventListener('message', handleResponse);
              window.parent.postMessage({
                type: 'RPC_REQUEST',
                payload: { method, params, address: IntersendSdkClient.address },
                id: messageId
              }, '*');
            });
        }
      }
    };

    return provider;
  }

  static getAddress = () => {
    return IntersendSdkClient.address;
  };

  static getProvider = () => {
    return IntersendSdkClient.provider;
  };
}