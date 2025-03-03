// ReownSdkClient.spec.ts
import { ReownSdkClient } from './ReownSdkClient.js';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';

// Mock the WalletConnectWalletAdapter so we can control its behavior in tests.
jest.mock('@solana/wallet-adapter-walletconnect', () => {
  return {
    WalletConnectWalletAdapter: jest.fn().mockImplementation((config) => ({
      // Simulate connect as a resolved promise.
      connect: jest.fn().mockResolvedValue(undefined),
      // For testing purposes, expose a fake publicKey object.
      publicKey: { toString: () => 'FakePublicKey' },
      // Simulate signMessage returning a Uint8Array.
      signMessage: jest.fn().mockImplementation((msg: Uint8Array) =>
        Promise.resolve(new Uint8Array([1, 2, 3]))
      ),
    })),
  };
});

// Mock logger so we don't pollute test output.
jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

describe('ReownSdkClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    ReownSdkClient.isInitialized = false;
    ReownSdkClient.walletConnectSdk = undefined as any;
    ReownSdkClient.adapter = undefined as any;
  });

  describe('init', () => {
    it('should initialize only once', async () => {
      await ReownSdkClient.init();
      expect(ReownSdkClient.isInitialized).toBe(true);
      const instance = ReownSdkClient.walletConnectSdk;

      // Calling init again should not reinitialize.
      await ReownSdkClient.init();
      expect(ReownSdkClient.walletConnectSdk).toBe(instance);
    });
  });

  describe('getAddress', () => {
    it('should return the public key as address', async () => {
      await ReownSdkClient.init();
      const address = ReownSdkClient.getAddress();
      expect(address?.toString()).toEqual('FakePublicKey');
    });
  });

  describe('getProvider', () => {
    it('should return adapter casted as ISolana', async () => {
      const fakeAdapter = { some: 'provider' } as unknown as SolanaAdapter;
      ReownSdkClient.adapter = { some: 'provider' } as unknown as SolanaAdapter;

      await ReownSdkClient.init();
      expect(ReownSdkClient.getProvider()).toStrictEqual(fakeAdapter);
    });
  });

  describe('signMessage', () => {
    it('should sign a message and return a Uint8Array', async () => {
      await ReownSdkClient.init();
      const message = new TextEncoder().encode('hello');
      const signature = await ReownSdkClient.signMessage(message);
      expect(signature).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe('connect', () => {
    it('should call walletConnectSdk.connect', async () => {
        await ReownSdkClient.init();
        await ReownSdkClient.connect();
        expect(ReownSdkClient.walletConnectSdk.connect).toHaveBeenCalled();
    });

    it('should throw an error if walletConnectSdk is not initialized', async () => {
        ReownSdkClient.walletConnectSdk = undefined as any;
        await expect(ReownSdkClient.connect()).rejects.toThrow(
        "WalletConnect adapter not initialized. Call init() first."
        );
    });

    // it('should throw error if publicKey is undefined after connect', async () => {
    //   await ReownSdkClient.init();
    //   // Simulate a scenario where publicKey is undefined.
    //   ReownSdkClient.walletConnectSdk.publicKey = undefined;
    //   await expect(ReownSdkClient.connect()).rejects.toThrow(
    //     "Failed to connect wallet: publicKey is undefined"
    //   );
    // });
  });
});

