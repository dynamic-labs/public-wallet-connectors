// ReownSdkClient.spec.ts
import { ReownProvider } from './ReownProvider.js';
import { ReownSdkClient } from './ReownSdkClient.js';
import { PublicKey, Transaction } from '@solana/web3.js';
// Mock the WalletConnectWalletAdapter so we can control its behavior in tests.
jest.mock('@walletconnect/solana-adapter', () => {
  return {
    WalletConnectWalletAdapter: jest.fn().mockImplementation((_config) => ({
      connect: jest.fn().mockResolvedValue(undefined),
      publicKey: { toString: () => 'FakePublicKey' },
      signMessage: jest.fn().mockImplementation((_msg: Uint8Array) =>
        Promise.resolve(new Uint8Array([1, 2, 3]))
      ),
      signTransaction: jest.fn().mockImplementation((tx: any) =>
        // Simulate signing by returning the transaction with a dummy signature.
        Promise.resolve({ ...tx, signature: Buffer.from("dummy_signature") })
      ),
      // You can add mocks for signAllTransactions/signAndSendTransaction as needed.
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

  describe('test initializing Provider', () => {
    it('should return a provider with proper properties', async () => {
      await ReownSdkClient.init();
      // Simulate connection status.
      ReownSdkClient.isConnected = true;
      
      const provider = ReownSdkClient.getProvider();
      expect(provider).toBeDefined();
 
      // Check publicKey.
      expect(provider.publicKey?.toString()).toEqual('FakePublicKey');
      // Check that delegated methods exist.
      expect(typeof provider.signTransaction).toBe('function');
      expect(typeof provider.signMessage).toBe('function');
      expect(typeof provider.connect).toBe('function');
      expect(typeof provider.disconnect).toBe('function');
      expect(typeof provider.signAndSendTransaction).toBe('function');

    });
  });

  describe('test getProvider', () => {
    it('should return the provider cast as ISolanaProvider', async () => {
      await ReownSdkClient.init();
      const mockProvider = new ReownProvider({} as any);
      ReownSdkClient.provider = mockProvider;
      ReownSdkClient.provider.publicKey = new PublicKey("11111111111111111111111111111111");
  
      const provider = ReownSdkClient.getProvider();
      expect(provider).toEqual(
        expect.objectContaining({
          isConnected: expect.any(Boolean),
          providers: expect.any(Array),
          signTransaction: expect.any(Function),
          signAllTransactions: expect.any(Function),
          signAndSendTransaction: expect.any(Function),
          signMessage: expect.any(Function),
          connect: expect.any(Function),
          disconnect: expect.any(Function),
        })
      );
       
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

  describe('signAndSendTransaction', () => {
    it('should sign and send a transaction and return a signature', async () => {
      await ReownSdkClient.init();
      const tx = new Transaction();
      const result = await ReownSdkClient.signAndSendTransaction(tx);
      // Expect that a signature string is returned.
      expect(result.signatures).toEqual(expect.any(Object));
      // Optionally, check for a specific dummy signature value.
      // expect(result.signatures).toEqual(expect.any(String));
    });
  });
});
