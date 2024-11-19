//@ts-nocheck
import { IntersendSdkClient } from './IntersendSdkClient.js';

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

describe('IntersendSdkClient', () => {
  let originalPostMessage: typeof window.parent.postMessage;
  let originalAddEventListener: typeof window.addEventListener;
  let postMessageMock: jest.Mock;
  let addEventListenerMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    IntersendSdkClient.isInitialized = false;
    IntersendSdkClient.address = undefined;
    IntersendSdkClient.provider = undefined as any;

    // Mock postMessage
    postMessageMock = jest.fn();
    originalPostMessage = window.parent.postMessage;
    window.parent.postMessage = postMessageMock;

    // Mock addEventListener
    addEventListenerMock = jest.fn();
    originalAddEventListener = window.addEventListener;
    window.addEventListener = addEventListenerMock;
  });

  afterEach(() => {
    window.parent.postMessage = originalPostMessage;
    window.addEventListener = originalAddEventListener;
  });

  describe('init', () => {
    it('should only initialize once', async () => {
      // Simulate successful wallet info response
      addEventListenerMock.mockImplementation((event, callback) => {
        callback({
          data: {
            type: 'WALLET_INFO',
            payload: {
              address: '0x123',
              chainId: '0x89'
            }
          }
        });
      });

      await IntersendSdkClient.init();
      const firstProvider = IntersendSdkClient.provider;
      expect(firstProvider).toBeDefined();
      expect(IntersendSdkClient.isInitialized).toBe(true);

      await IntersendSdkClient.init();
      expect(IntersendSdkClient.provider).toBe(firstProvider);
      expect(postMessageMock).toHaveBeenCalledTimes(1);
    });

    it('should set up provider with correct methods', async () => {
      addEventListenerMock.mockImplementation((event, callback) => {
        callback({
          data: {
            type: 'WALLET_INFO',
            payload: {
              address: '0x123',
              chainId: '0x89'
            }
          }
        });
      });

      await IntersendSdkClient.init();
      const provider = IntersendSdkClient.provider;

      expect(provider.isMetaMask).toBe(false);
      expect(provider.isIntersend).toBe(true);
      expect(provider.isSafe).toBe(true);
      expect(provider.isPortability).toBe(true);
      expect(provider.request).toBeDefined();
    });

    it('should handle provider requests correctly', async () => {
      addEventListenerMock.mockImplementation((event, callback) => {
        callback({
          data: {
            type: 'WALLET_INFO',
            payload: {
              address: '0x123',
              chainId: '0x89'
            }
          }
        });
      });

      await IntersendSdkClient.init();
      const provider = IntersendSdkClient.provider;

      // Test eth_accounts
      const accounts = await provider.request({ method: 'eth_accounts' });
      expect(accounts).toEqual(['0x123']);

      // Test eth_chainId
      const chainId = await provider.request({ method: 'eth_chainId' });
      expect(chainId).toBe('0x89');
    });

    it('should handle signature requests', async () => {
      const mockSignature = '0xsignature';
      
      addEventListenerMock.mockImplementation((event, callback) => {
        if (event === 'message') {
          // First call for initialization
          callback({
            data: {
              type: 'WALLET_INFO',
              payload: {
                address: '0x123',
                chainId: '0x89'
              }
            }
          });

          // Second call for signature response
          setTimeout(() => {
            callback({
              data: {
                type: 'SIGNATURE_RESPONSE',
                payload: {
                  signature: mockSignature
                },
                id: expect.any(String)
              }
            });
          }, 0);
        }
      });

      await IntersendSdkClient.init();
      const provider = IntersendSdkClient.provider;

      const signature = await provider.request({
        method: 'personal_sign',
        params: ['message', '0x123']
      });

      expect(signature).toBe(mockSignature);
      expect(postMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SIGNATURE_REQUEST',
          payload: expect.objectContaining({
            method: 'personal_sign',
            params: ['message', '0x123']
          })
        }),
        '*'
      );
    });

    it('should handle signature request errors', async () => {
      addEventListenerMock.mockImplementation((event, callback) => {
        if (event === 'message') {
          // First call for initialization
          callback({
            data: {
              type: 'WALLET_INFO',
              payload: {
                address: '0x123',
                chainId: '0x89'
              }
            }
          });

          // Second call for signature error
          setTimeout(() => {
            callback({
              data: {
                type: 'SIGNATURE_RESPONSE',
                error: 'User rejected',
                id: expect.any(String)
              }
            });
          }, 0);
        }
      });

      await IntersendSdkClient.init();
      const provider = IntersendSdkClient.provider;

      await expect(
        provider.request({
          method: 'personal_sign',
          params: ['message', '0x123']
        })
      ).rejects.toThrow('User rejected');
    });
  });

  describe('getAddress', () => {
    it('should return undefined when not initialized', () => {
      expect(IntersendSdkClient.getAddress()).toBeUndefined();
    });

    it('should return address when initialized', async () => {
      addEventListenerMock.mockImplementation((event, callback) => {
        callback({
          data: {
            type: 'WALLET_INFO',
            payload: {
              address: '0x123',
              chainId: '0x89'
            }
          }
        });
      });

      await IntersendSdkClient.init();
      expect(IntersendSdkClient.getAddress()).toBe('0x123');
    });
  });

  describe('getProvider', () => {
    it('should return the provider', async () => {
      addEventListenerMock.mockImplementation((event, callback) => {
        callback({
          data: {
            type: 'WALLET_INFO',
            payload: {
              address: '0x123',
              chainId: '0x89'
            }
          }
        });
      });

      await IntersendSdkClient.init();
      const provider = IntersendSdkClient.getProvider();
      expect(provider).toBeDefined();
      expect(provider.isIntersend).toBe(true);
    });
  });

  describe('constructor', () => {
    it('should not be instantiable', () => {
      // @ts-expect-error testing private constructor
      expect(() => new IntersendSdkClient()).toThrow();
    });
  });
});