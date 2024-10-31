/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { SafeEvmWalletConnector } from './SafeEvmWalletConnector.js';
import { SafeSdkClient } from './SafeSdkClient.js';

jest.mock('./SafeSdkClient.js');
jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  ...jest.requireActual('@dynamic-labs/wallet-connector-core'),
  logger: {
    debug: jest.fn(),
  },
}));

const walletConnectorProps: EthereumWalletConnectorOpts = {
  walletBook: {} as any,
  evmNetworks: [],
} as any as EthereumWalletConnectorOpts;

describe('SafeEvmWalletConnector', () => {
  let connector: SafeEvmWalletConnector;
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new SafeEvmWalletConnector(walletConnectorProps);
    emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');

    (SafeSdkClient.getAddress as jest.Mock).mockResolvedValue('0x123');
    (SafeSdkClient.isInitialized as any) = false;
  });

  it('should initialize with correct name', () => {
    expect(connector.name).toBe('Safe');
  });

  describe('init', () => {
    it('should initialize provider and emit events if in Safe app', async () => {
      await connector.init();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(SafeSdkClient.init).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
      expect(emitSpy).toHaveBeenCalledWith('autoConnect', { connector });
    });

    it('should not initialize provider if already initialized', async () => {
      (SafeSdkClient.isInitialized as any) = true;
      await connector.init();

      expect(SafeSdkClient.init).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit autoConnect if no safe address', async () => {
      (SafeSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      await connector.init();

      expect(emitSpy).not.toHaveBeenCalledWith('autoConnect', expect.any(Object));
    });
  });

  describe('supportsNetworkSwitching', () => {
    it('should return false', () => {
      expect(connector.supportsNetworkSwitching()).toBe(false);
    });
  });

  describe('findProvider', () => {
    it('should return the provider from SafeSdkClient', () => {
      const mockProvider = {} as any;
      (SafeSdkClient.getProvider as jest.Mock).mockReturnValue(mockProvider);

      expect(connector.findProvider()).toBe(mockProvider);
    });
  });

  describe('getAddress', () => {
    it('should return the safe address if available', async () => {
      expect(await connector.getAddress()).toBe('0x123');
    });

    it('should return undefined if safe info is not available', async () => {
      (SafeSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      expect(await connector.getAddress()).toBeUndefined();
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return an empty array if no safe address is available', async () => {
      (SafeSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
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
    it('should return undefined if no client is found', async () => {
      jest.spyOn(connector, 'getWalletClient').mockReturnValue(undefined);

      expect(await connector.signMessage('Hello, world!')).toBeUndefined();
    });

    it('should return the signed message', async () => {
      jest.spyOn(connector, 'getWalletClient').mockReturnValue({
        signMessage: jest.fn().mockResolvedValue('0x123'),
      } as any);

      expect(await connector.signMessage('Hello, world!')).toBe('0x123');
    });
  });

  describe('filter', () => {
    it('should return true if provider is available', () => {
      (SafeSdkClient.getProvider as jest.Mock).mockReturnValue({});
      expect(connector.filter()).toBe(true);
    });

    it('should return false if provider is not available', () => {
      (SafeSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
      expect(connector.filter()).toBe(false);
    });
  });
});
