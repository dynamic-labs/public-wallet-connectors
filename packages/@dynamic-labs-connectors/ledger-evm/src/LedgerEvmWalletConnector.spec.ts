/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { LedgerEvmWalletConnector } from './LedgerEvmWalletConnector.js';
import { LedgerSdkClient } from './LedgerSdkClient.js';

jest.mock('./LedgerSdkClient.js');
jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  ...jest.requireActual('@dynamic-labs/wallet-connector-core'),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

const walletConnectorProps: EthereumWalletConnectorOpts = {
  walletBook: {} as any,
  evmNetworks: [],
} as any as EthereumWalletConnectorOpts;

describe('LedgerEvmWalletConnector', () => {
  let connector: LedgerEvmWalletConnector;
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new LedgerEvmWalletConnector(walletConnectorProps);
    emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');

    (LedgerSdkClient.getAddress as jest.Mock).mockResolvedValue('0x123');
    (LedgerSdkClient.isInitialized as any) = false;
  });

  it('should initialize with correct name', () => {
    expect(connector.name).toBe('Ledger Live');
  });

  describe('init', () => {
    it('should initialize provider and emit events if Ledger is available', async () => {
      (LedgerSdkClient.isLedgerLive as jest.Mock).mockReturnValue(true);
      await connector.init();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(LedgerSdkClient.init).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
      expect(emitSpy).toHaveBeenCalledWith('autoConnect', { connector });
    });

    it('should not initialize provider if Ledger is not available', async () => {
      (LedgerSdkClient.isLedgerLive as jest.Mock).mockReturnValue(false);
      await connector.init();

      expect(LedgerSdkClient.init).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });
    it('should not initialize provider if already initialized', async () => {
      (LedgerSdkClient.isInitialized as any) = true;
      await connector.init();

      expect(LedgerSdkClient.init).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit autoConnect if no Ledger address', async () => {
      (LedgerSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      await connector.init();

      expect(emitSpy).not.toHaveBeenCalledWith(
        'autoConnect',
        expect.any(Object),
      );
    });
  });

  describe('findProvider', () => {
    it('should return the provider from LedgerSdkClient', () => {
      const mockProvider = {} as any;
      (LedgerSdkClient.getProvider as jest.Mock).mockReturnValue(mockProvider);

      expect(connector.findProvider()).toBe(mockProvider);
    });
  });

  describe('getAddress', () => {
    it('should return the Ledger address if available', async () => {
      expect(await connector.getAddress()).toBe('0x123');
    });

    it('should return undefined if no Ledger address is available', async () => {
      (LedgerSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      expect(await connector.getAddress()).toBeUndefined();
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return an empty array if no Ledger address is available', async () => {
      (LedgerSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      expect(await connector.getConnectedAccounts()).toEqual([]);
    });

    it('should return the connected accounts and set active account', async () => {
      const setActiveAccountSpy = jest
        .spyOn(connector, 'setActiveAccount')
        .mockImplementation(() => undefined);

      const accounts = await connector.getConnectedAccounts();

      expect(accounts).toEqual(['0x123']);
      expect(setActiveAccountSpy).toHaveBeenCalledWith('0x123');
    });
  });

  describe('signMessage', () => {
    it('should return undefined if provider is not available', async () => {
      jest
        .spyOn(LedgerSdkClient, 'getProvider')
        .mockReturnValue(undefined as any);

      expect(await connector.signMessage('Hello, world!')).toBeUndefined();
    });

    it('should return the signed message', async () => {
      const mockProvider = {
        request: jest.fn().mockResolvedValue('0x456'),
      };
      jest
        .spyOn(LedgerSdkClient, 'getProvider')
        .mockReturnValue(mockProvider as any);
      jest.spyOn(connector, 'getActiveAccount').mockReturnValue({
        address: '0x123',
      } as any);

      const signature = await connector.signMessage('Hello, world!');

      expect(signature).toBe('0x456');
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: ['0x48656c6c6f2c20776f726c6421', '0x123'],
      });
    });

    it('should log an error if signing fails', async () => {
      const mockProvider = {
        request: jest.fn().mockRejectedValue(new Error('Signing error')),
      };
      jest
        .spyOn(LedgerSdkClient, 'getProvider')
        .mockReturnValue(mockProvider as any);
      jest.spyOn(connector, 'getActiveAccount').mockReturnValue({
        address: '0x123',
      } as any);

      const signature = await connector.signMessage('Hello, world!');

      expect(signature).toBeUndefined();
      expect(
        require('@dynamic-labs/wallet-connector-core').logger.error,
      ).toHaveBeenCalledWith(
        '[LedgerEvmWalletConnector] signMessage failed',
        expect.any(Error),
      );
    });
  });

  describe('filter', () => {
    it('should return true if provider is available', () => {
      (LedgerSdkClient.getProvider as jest.Mock).mockReturnValue({});
      expect(connector.filter()).toBe(true);
    });

    it('should return false if provider is not available', () => {
      (LedgerSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
      expect(connector.filter()).toBe(false);
    });
  });
});
