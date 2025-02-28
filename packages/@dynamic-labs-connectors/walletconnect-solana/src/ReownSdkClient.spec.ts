// ReownSdkClient.spec.ts
//import { SolanaAdapter } from '@reown/appkit-adapter-solana';
//import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { ReownSdkClient } from './ReownSdkClient';

// Mock the SolanaAdapter and WalletConnectWalletAdapter
jest.mock('@reown/appkit-adapter-solana', () => {
  return {
    SolanaAdapter: jest.fn().mockImplementation((config) => {
      return {
        config,
        connect: jest.fn().mockResolvedValue({ address: 'FakeSolanaAddress' }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        signMessage: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
    }),
    WalletAdapterNetwork: {
      Mainnet: 'mainnet-beta',
      Devnet: 'devnet'
    }
  };
});

jest.mock('@solana/wallet-adapter-walletconnect', () => {
  return {
    WalletConnectWalletAdapter: jest.fn().mockImplementation((config) => {
      return { config };
    }),
  };
});

// Mock logger
jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

describe('ReownSdkClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    (ReownSdkClient as any).isInitialized = false;
    (ReownSdkClient as any).adapter = undefined;
    (ReownSdkClient as any).walletInfo = undefined;
    (ReownSdkClient as any).provider = undefined;
  });

  describe('init', () => {
    it('should only initialize once', async () => {
      await ReownSdkClient.init();
      const firstAdapter = (ReownSdkClient as any).adapter;
      expect(firstAdapter).toBeDefined();
      expect((ReownSdkClient as any).isInitialized).toBe(true);

      await ReownSdkClient.init();
      expect((ReownSdkClient as any).adapter).toBe(firstAdapter);
      // The adapter should have connected only once (if auto-connect was triggered)
      // We assume connect is called once during initialization if walletInfo is unset.
      expect(firstAdapter.connect).toHaveBeenCalledTimes(1);
    });

    it('should set walletInfo and log if auto-connect succeeds', async () => {
      await ReownSdkClient.init();
      expect((ReownSdkClient as any).walletInfo).toEqual({ address: 'FakeSolanaAddress' });
      expect(logger.debug).toHaveBeenCalledWith(
        '[ReownSdkClient] Connected, wallet info:',
        { address: 'FakeSolanaAddress' }
      );
    });
  });

  describe('getAddress', () => {
    it('should return undefined when walletInfo is not available', () => {
      (ReownSdkClient as any).walletInfo = undefined;
      expect(ReownSdkClient.getAddress()).toBeUndefined();
    });

    it('should return the wallet address when walletInfo is available', () => {
      (ReownSdkClient as any).walletInfo = { address: 'FakeSolanaAddress' };
      expect(ReownSdkClient.getAddress()).toBe('FakeSolanaAddress');
    });
  });

//   describe('getProvider', () => {
//     it('should return the provider cast as ISolana', () => {
//       const fakeProvider = { some: 'provider' };
//       (ReownSdkClient as any).provider = fakeProvider;
//       expect(ReownSdkClient.getProvider()).toBe(fakeProvider);
//     });
//   });

//   describe('connect', () => {
//     it('should call adapter.connect if walletInfo is not set', async () => {
//       // Ensure walletInfo is cleared
//       (ReownSdkClient as any).walletInfo = undefined;
//       // First, initialize to set up the adapter
//       await ReownSdkClient.init();
//       const adapter = (ReownSdkClient as any).adapter;
//       // Reset connect mock to verify call during connect() method
//       (adapter.connect as jest.Mock).mockClear();

//       await ReownSdkClient.connect();
//       expect(adapter.connect).toHaveBeenCalled();
//       expect((ReownSdkClient as any).walletInfo).toEqual({ address: 'FakeSolanaAddress' });
//     });
//   });

//   describe('disconnect', () => {
//     it('should call adapter.disconnect and clear walletInfo', async () => {
//       await ReownSdkClient.init();
//       const adapter = (ReownSdkClient as any).adapter;
//       // Call disconnect and check that adapter.disconnect was invoked
//       await ReownSdkClient.disconnect();
//       expect(adapter.disconnect).toHaveBeenCalled();
//       expect((ReownSdkClient as any).walletInfo).toBeUndefined();
//     });
//   });

  describe('constructor', () => {
    it('should not be instantiable', () => {
      // @ts-expect-error: testing private constructor
      expect(() => new ReownSdkClient()).toThrow();
    });
  });
});
