import { LedgerSdkClient } from './LedgerSdkClient.js';

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LedgerSdkClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    LedgerSdkClient.isInitialized = false;
    LedgerSdkClient.provider = undefined;
    (global as any).window = {};
  });

  describe('init', () => {
    it('should not initialize if already initialized', async () => {
      LedgerSdkClient.isInitialized = true;

      await LedgerSdkClient.init();

      expect(LedgerSdkClient.provider).toBeUndefined();
    });

    it('should log a debug message if window.ethereum is not available', async () => {
      await LedgerSdkClient.init();

      expect(LedgerSdkClient.provider).toBeUndefined();
      expect(
        require('@dynamic-labs/wallet-connector-core').logger.debug,
      ).toHaveBeenCalledWith('[LedgerSdkClient] Ethereum provider not found');
    });

    it('should not initialize the provider if window.ethereum is not a Ledger provider', async () => {
      (global as any).window.ethereum = {};

      await LedgerSdkClient.init();

      expect(LedgerSdkClient.provider).toBeUndefined();
    });

    it('should initialize the provider if window.ethereum is a Ledger provider', async () => {
      (global as any).window.ethereum = { isLedgerLive: true };

      await LedgerSdkClient.init();

      expect(LedgerSdkClient.isInitialized).toBe(true);
      expect(LedgerSdkClient.provider).toBe(window.ethereum);
    });
  });

  describe('getAddress', () => {
    it('should return undefined if no accounts are available', async () => {
      (global as any).window.ethereum = {
        request: jest.fn().mockResolvedValue([]),
      };

      const address = await LedgerSdkClient.getAddress();

      expect(address).toBeUndefined();
    });

    it('should return the first account if accounts are available', async () => {
      (global as any).window.ethereum = {
        request: jest.fn().mockResolvedValue(['0x123']),
      };

      const address = await LedgerSdkClient.getAddress();

      expect(address).toBe('0x123');
    });
  });

  describe('getProvider', () => {
    it('should return the provider cast as IEthereum', () => {
      const mockProvider = { isLedgerLive: true };
      LedgerSdkClient.provider = mockProvider as any;

      const provider = LedgerSdkClient.getProvider();

      expect(provider).toBe(mockProvider);
    });
  });

  describe('constructor', () => {
    it('should not be instantiable', () => {
      // @ts-expect-error testing private constructor
      expect(() => new LedgerSdkClient()).toThrow();
    });
  });
});
