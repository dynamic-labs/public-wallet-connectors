import { IntersendSdkClient } from './IntersendSdkClient.js';

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

const mockPostMessage = jest.fn();
const mockAddEventListener = jest.fn();

describe('IntersendSdkClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    IntersendSdkClient.isInitialized = false;
    IntersendSdkClient.intersendInfo = undefined;
    IntersendSdkClient.provider = undefined as any;

    // Setup window mocks
    global.window = Object.create(window);
    Object.defineProperty(global.window, 'postMessage', {
      configurable: true,
      value: mockPostMessage,
    });
    Object.defineProperty(global.window, 'addEventListener', {
      configurable: true,
      value: mockAddEventListener,
    });

    Object.defineProperty(global.window, 'crypto', {
      configurable: true,
      value: {
        randomUUID: jest.fn().mockReturnValue('123'),
      },
    });
  });

  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should not be instantiable', () => {
      expect(() => new (IntersendSdkClient as any)()).toThrow();
    });
  });

  describe('init', () => {
    it('should only initialize once', async () => {
      const mockInfo = {
        address: '0x123',
        chainId: 1,
      };

      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          // @ts-expect-error - Event handler type is complex
          handler({
            data: {
              type: 'INTERSEND_CONNECT_RESPONSE',
              payload: mockInfo,
            },
          });
        }
      });

      await IntersendSdkClient.init();
      expect(IntersendSdkClient.isInitialized).toBe(true);
      expect(IntersendSdkClient.intersendInfo).toEqual(mockInfo);
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);

      // Second init should not reinitialize
      await IntersendSdkClient.init();
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout when info is not received', async () => {
      jest.useFakeTimers();
      
      const initPromise = IntersendSdkClient.init();
      jest.advanceTimersByTime(1000);
      
      await initPromise;
      expect(IntersendSdkClient.intersendInfo).toBeUndefined();
      
      jest.useRealTimers();
    });
  });

  describe('getAddress', () => {
    it('should return undefined when info is not available', () => {
      IntersendSdkClient.intersendInfo = undefined;
      expect(IntersendSdkClient.getAddress()).toBeUndefined();
    });

    it('should return address when info is available', () => {
      IntersendSdkClient.intersendInfo = {
        address: '0x123',
        chainId: 1,
      };
      expect(IntersendSdkClient.getAddress()).toBe('0x123');
    });
  });

  describe('getProvider', () => {
    it('should return the provider', () => {
      const mockProvider = {} as any;
      IntersendSdkClient.provider = mockProvider;
      expect(IntersendSdkClient.getProvider()).toBe(mockProvider);
    });
  });

  describe('provider methods', () => {
    beforeEach(async () => {
      const mockInfo = {
        address: '0x123',
        chainId: 1,
      };

      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          // @ts-expect-error - Event handler type is complex
          handler({
            data: {
              type: 'INTERSEND_CONNECT_RESPONSE',
              payload: mockInfo,
            },
          });
        }
      });

      await IntersendSdkClient.init();
    });

    it('should handle eth_requestAccounts', async () => {
      const provider = IntersendSdkClient.getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });
      expect(accounts).toEqual(['0x123']);
    });

    it('should handle eth_chainId', async () => {
      const provider = IntersendSdkClient.getProvider();
      const chainId = await provider.request({
        method: 'eth_chainId',
        params: [],
      });
      expect(chainId).toBe('0x1');
    });

    it('should throw error for unsupported methods', async () => {
      const provider = IntersendSdkClient.getProvider();
      await expect(
        provider.request({
          method: 'unsupported_method',
          params: [],
        })
      ).rejects.toThrow('Unsupported method: unsupported_method');
    });
  });
});