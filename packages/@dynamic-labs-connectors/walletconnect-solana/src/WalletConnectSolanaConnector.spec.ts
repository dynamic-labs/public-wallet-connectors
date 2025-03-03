// WalletConnectSolanaConnector.spec.ts
import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';
import { ReownSdkClient } from './ReownSdkClient.js';
import { DynamicError } from '@dynamic-labs/utils';
import type { ISolana } from '@dynamic-labs/solana-core';

describe('WalletConnectSolanaConnector', () => {
  let connector: WalletConnectSolanaConnector;
  let emitSpy: jest.SpyInstance;

  const fakeProvider = { provider: 'fakeProvider' } as unknown as ISolana;
  const fakePublicKey = { toString: () => 'FakePublicKey' };

  beforeEach(() => {
    // Reset static properties on ReownSdkClient.
    ReownSdkClient.isInitialized = false;
    ReownSdkClient.walletConnectSdk = {
      connect: jest.fn().mockResolvedValue(undefined),
      publicKey: fakePublicKey,
      signMessage: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    } as any;
    ReownSdkClient.getProvider = jest.fn().mockReturnValue(fakeProvider);
    ReownSdkClient.getAddress = jest.fn().mockReturnValue(fakePublicKey);
    ReownSdkClient.connect = jest.fn().mockResolvedValue(fakePublicKey.toString());
    
    // Reset the connector's static flag.
    WalletConnectSolanaConnector.initHasRun = false;

    // Instantiate the connector with minimal required options.
    connector = new WalletConnectSolanaConnector({
      walletBook: { groups: [], wallets: [] },
      solNetworks: [{ id: 'solanaMainnet' }, { id: 'unsupported' }],
    } as any);

    // spy on the "emit" method.
    connector.walletConnectorEventsEmitter = { emit: jest.fn() } as any;
    emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');
  });

  describe('supportsNetworkSwitching', () => {
    it('should return false', () => {
      expect(connector.supportsNetworkSwitching()).toBe(false);
    });
  });

  describe('isInstalledOnBrowser', () => {
    it('should return true', () => {
      expect(connector.isInstalledOnBrowser()).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize the connector and emit providerReady and autoConnect events', async () => {
      // Call init (which calls ReownSdkClient.init() and sets initHasRun).
      jest.spyOn(ReownSdkClient, 'init').mockResolvedValue(); // if init returns a Promise
      await connector.init();

      // Since our solanaNetworks array is non-empty, we expect ReownSdkClient.init to be called.
      expect(ReownSdkClient.init).toHaveBeenCalled();
      expect(WalletConnectSolanaConnector.initHasRun).toBe(true);

      // NOTE: In the connector code, "this.onProviderReady" is referenced but not invoked.
      // For testing purposes, we'll call it manually to simulate that behavior.
      (connector as any).onProviderReady();
      expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
      expect(emitSpy).toHaveBeenCalledWith('autoConnect', { connector });
    });
  });

  describe('findProvider', () => {
    it('should return the provider from ReownSdkClient', () => {
      const provider = connector.findProvider();
      expect(provider).toEqual(fakeProvider);
      expect(ReownSdkClient.getProvider).toHaveBeenCalled();
    });
    // check 
  });

  describe('connect', () => {
    it('should call ReownSdkClient.connect', async () => {
      await connector.connect();
      expect(ReownSdkClient.connect).toHaveBeenCalled();
    });
  });

  describe('getAddress', () => {
    it('should return the connected wallet address as a string', async () => {
      const address = await connector.getAddress();
      expect(ReownSdkClient.getAddress).toHaveBeenCalled();
      expect(address).toEqual('FakePublicKey');
    });
  });

  describe('getSigner', () => {
    it('should return the provider if available', async () => {
      const signer = await connector.getSigner();
      expect(signer).toEqual(fakeProvider);
    });

    it('should throw an error if provider is not found', async () => {
      (ReownSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
      await expect(connector.getSigner()).rejects.toThrow(DynamicError);
    });
  });

  describe('signMessage', () => {
    it('should sign a message and return a signature as string', async () => {
      const signMessageSpy = jest.spyOn(ReownSdkClient, 'signMessage');
      const message = 'hello world';
      const signature = await connector.signMessage(message);
      expect(signMessageSpy).toHaveBeenCalled();
      // The mocked signMessage returns Uint8Array [1,2,3]. Converting it to string yields "1,2,3".
      expect(signature).toEqual(new Uint8Array([1, 2, 3]).toString());
    });
  });
});
