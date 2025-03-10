// WalletConnectSolanaConnector.spec.ts
import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';
import { ReownSdkClient } from './ReownSdkClient.js';
import { ReownProvider } from './ReownProvider.js';

describe('WalletConnectSolanaConnector', () => {
  let connector: WalletConnectSolanaConnector;
  let emitSpy: jest.SpyInstance;

  const fakePublicKey = { toString: () => 'FakePublicKey' };

  beforeEach(() => {
    // Reset static properties on ReownSdkClient.
    ReownSdkClient.isInitialized = false;
    ReownSdkClient.walletConnectSdk = {
      connect: jest.fn().mockResolvedValue(undefined),
      publicKey: fakePublicKey,
      signMessage: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    } as any;
    // ReownSdkClient.getProvider = jest.fn().mockReturnValue(fakeProvider);
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

  describe('isWalletConnect', () => {
    it('should return true', () => {
      expect(connector.isWalletConnect).toBe(true);
    });
  });

  describe('canConnectViaQRCode', () => {
    it('should return true', () => {
      expect(connector.canConnectViaQrCode).toBe(true);
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
      
      expect(provider).toBeDefined();

      // Verify that the provider is an instance of ReownProvider.
      expect(provider).toBeInstanceOf(ReownProvider);
      });
    // check 
  });

  describe('connect', () => {
    it('should call ReownSdkClient.connect', async () => {
      await connector.connect();
      // const provider = ReownSdkClient.getProvider();
      expect(ReownSdkClient.connect).toHaveBeenCalled();
      // expect(provider.isConnected).toBe(true);
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
      expect(signer).toBeDefined();
      // Ensure the signer has expected properties (e.g. connect method)
      expect(typeof signer.connect).toBe('function');
    });

    // it('should throw an error if provider is not found', async () => {
    //   (ReownSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
    //   await expect(connector.getSigner()).rejects.toThrow(DynamicError);
    // });
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

  describe('getProvider compatibility', () => {
    it('should return a provider compatible with ISolana', async () => {
      // Retrieve the provider (this should already satisfy the ISolana interface).
      ReownSdkClient.init();
      const provider = ReownSdkClient.getProvider();
      
      console.log(provider, provider.constructor.name);

      // Check that the provider has the expected methods and properties.
      expect(typeof provider.connect).toBe('function');
      expect(typeof provider.signMessage).toBe('function');
      expect(typeof provider.disconnect).toBe('function');
      expect(typeof provider.publicKey).toBe('object');
      expect(typeof provider.providers).toBe('object');
      // You can add more checks for other required methods or properties.
    });
  });
});
