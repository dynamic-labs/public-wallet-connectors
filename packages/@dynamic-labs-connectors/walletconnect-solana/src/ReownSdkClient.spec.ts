// ReownSdkClient.spec.ts
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { ReownSdkClient } from './ReownSdkClient.js';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';

// Mock the WalletConnectWalletAdapter so we can control its behavior in tests.
jest.mock('@solana/wallet-adapter-walletconnect', () => {
  return {
    WalletConnectWalletAdapter: jest.fn().mockImplementation((_config) => ({
      // Simulate connect as a resolved promise.
      connect: jest.fn().mockResolvedValue(undefined),
      // For testing purposes, expose a fake publicKey object.
      publicKey: { toString: () => 'FakePublicKey' },
      // Simulate signMessage returning a Uint8Array.
      signMessage: jest.fn().mockImplementation((_msg: Uint8Array) =>
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
    ReownSdkClient.isConnected = false;
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
    it('should return return true for all these proving it is casted to ISolana as Dynamic WalletConnect', async () => {
      // const fakeAdapter = { 
      //   connect: jest.fn(),
      //   publicKey: { 
      //     toString: () => 'FakePublicKey', 
      //   },
      //   signMessage: jest.fn(),
      // } as unknown as WalletConnectWalletAdapter;

      await ReownSdkClient.init();
      // expect(ReownSdkClient.getProvider()).toStrictEqual(fakeAdapter);   
      expect(typeof ReownSdkClient.getProvider().connect).toBe('function');
      expect(typeof ReownSdkClient.getProvider().signMessage).toBe('function');
      expect(ReownSdkClient.getProvider().publicKey).toHaveProperty('toString');
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

  });
});

