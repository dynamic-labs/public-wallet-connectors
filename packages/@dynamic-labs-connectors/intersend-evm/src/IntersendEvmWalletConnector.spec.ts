/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { IntersendEvmWalletConnector } from './IntersendEvmWalletConnector.js';
import { IntersendSdkClient } from './IntersendSdkClient.js';

jest.mock('./IntersendSdkClient.js');
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

describe('IntersendEvmWalletConnector', () => {
  let connector: IntersendEvmWalletConnector;
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new IntersendEvmWalletConnector(walletConnectorProps);
    emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');

    (IntersendSdkClient.getAddress as jest.Mock).mockResolvedValue('0x123');
    (IntersendSdkClient.isInitialized as any) = false;
  });

  it('should initialize with correct name', () => {
    expect(connector.name).toBe('Intersend');
  });

  describe('init', () => {
    it('should initialize provider and emit events', async () => {
      await connector.init();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(IntersendSdkClient.init).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
      expect(emitSpy).toHaveBeenCalledWith('autoConnect', { connector });
    });

    it('should not initialize provider if already initialized', async () => {
      (IntersendSdkClient.isInitialized as any) = true;
      await connector.init();

      expect(IntersendSdkClient.init).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit autoConnect if no address', async () => {
      (IntersendSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
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
    it('should return the provider from IntersendSdkClient', () => {
      const mockProvider = {} as any;
      (IntersendSdkClient.getProvider as jest.Mock).mockReturnValue(mockProvider);

      expect(connector.findProvider()).toBe(mockProvider);
    });
  });

  describe('getAddress', () => {
    it('should return the address if available', async () => {
      expect(await connector.getAddress()).toBe('0x123');
    });

    it('should return undefined if address is not available', async () => {
      (IntersendSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
      expect(await connector.getAddress()).toBeUndefined();
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return an empty array if no address is available', async () => {
      (IntersendSdkClient.getAddress as jest.Mock).mockResolvedValue(undefined);
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
      (IntersendSdkClient.getProvider as jest.Mock).mockReturnValue({});
      expect(connector.filter()).toBe(true);
    });

    it('should return false if provider is not available', () => {
      (IntersendSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
      expect(connector.filter()).toBe(false);
    });
  });
});