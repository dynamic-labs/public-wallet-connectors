// import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector';
// import { universalProviderClient } from './SolanaUniversalProvider';
// import { PublicKey } from '@solana/web3.js';

// describe('WalletConnectSolanaConnector', () => {
//   let connector: WalletConnectSolanaConnector;
//   let emitSpy: jest.SpyInstance;

//   // Use a valid PublicKey instance.
//   const fakePublicKey = new PublicKey('11111111111111111111111111111111');

//   beforeEach(() => {
//     // Reset universalProviderClient's internal state.
//     (universalProviderClient as any)._provider = {
//       connect: jest.fn().mockResolvedValue(undefined),
//       disconnect: jest.fn().mockResolvedValue(undefined),
//       request: jest.fn(),
//       on: jest.fn(),
//     };
//     (universalProviderClient as any)._publicKey = fakePublicKey;
//     (universalProviderClient as any)._isConnected = true;

//     // Reset the connector's static flag.
//     WalletConnectSolanaConnector.initHasRun = false;

//     // Instantiate the connector with minimal options.
//     connector = new WalletConnectSolanaConnector({
//       walletBook: { groups: [], wallets: [] },
//       solNetworks: [{ id: 'solanaMainnet' }, { id: 'unsupported' }],
//     } as any);

//     // Stub methods to match expected values.
//     jest.spyOn(connector, 'supportsNetworkSwitching').mockReturnValue(false);
//     jest.spyOn(connector, 'isInstalledOnBrowser').mockReturnValue(false);

//     // Provide an implementation for onProviderReady for testing.
//     (connector as any).onProviderReady = () => {
//       connector.walletConnectorEventsEmitter.emit('providerReady', { connector });
//       connector.walletConnectorEventsEmitter.emit('autoConnect', { connector });
//     };

//     // Stub the event emitter.
//     connector.walletConnectorEventsEmitter = { emit: jest.fn() } as any;
//     emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');
//   });

//   describe('supportsNetworkSwitching', () => {
//     it('should return false', () => {
//       expect(connector.supportsNetworkSwitching()).toBe(false);
//     });
//   });

//   describe('isInstalledOnBrowser', () => {
//     it('should return false', () => {
//       expect(connector.isInstalledOnBrowser()).toBe(false);
//     });
//   });

//   describe('isWalletConnect', () => {
//     it('should return true', () => {
//       expect(connector.isWalletConnect).toBe(true);
//     });
//   });

//   describe('canConnectViaQRCode', () => {
//     it('should return true', () => {
//       expect(connector.canConnectViaQrCode).toBe(true);
//     });
//   });

//   describe('init', () => {
//     it('should initialize the connector and emit providerReady and autoConnect events', async () => {
//       jest.spyOn(universalProviderClient, 'init').mockResolvedValue();
//       await connector.init();

//       expect(universalProviderClient.init).toHaveBeenCalled();
//       expect(WalletConnectSolanaConnector.initHasRun).toBe(true);

//       // Simulate provider readiness.
//       (connector as any).onProviderReady();
//       expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
//       expect(emitSpy).toHaveBeenCalledWith('autoConnect', { connector });
//     });
//   });

//   describe('findProvider', () => {
//     it('should return the provider from universalProviderClient', () => {
//       const provider = connector.findProvider();
//       expect(provider).toBeDefined();
//       if (!provider) throw new Error('Provider is undefined');
//       expect(typeof provider.connect).toBe('function');
//       expect(typeof provider.signMessage).toBe('function');
//       expect(typeof provider.disconnect).toBe('function');
//     });
//   });

//   describe('connect', () => {
//     it('should call universalProviderClient.connect', async () => {
//       // Return a proper ConnectionResult object.
//       jest.spyOn(universalProviderClient, 'connect').mockResolvedValue({
//         publicKey: fakePublicKey.toBytes(),
//       });
//       await connector.connect();
//       expect(universalProviderClient.connect).toHaveBeenCalled();
//     });
//   });

//   describe('getAddress', () => {
//     it('should return the connected wallet address as a string', async () => {
//       jest.spyOn(universalProviderClient, 'getPublicKey').mockResolvedValue(fakePublicKey);
//       const address = await connector.getPublicKey();
//       expect(universalProviderClient.getPublicKey).toHaveBeenCalled();
//       expect(address.toString()).toEqual('11111111111111111111111111111111');
//     });
//   });

//   describe('getSigner', () => {
//     it('should return the provider if available', async () => {
//       const mockProvider = { connect: jest.fn() };
//       (universalProviderClient as any)._provider = mockProvider;
//       const signer = await connector.getSigner();
//       expect(signer).toBeDefined();
//       if (signer != null) {
//         expect(typeof signer.connect).toBe('function');
//       }
//     });
//   });

//   describe('signMessage', () => {
//     it('should sign a message and return a signature as a base64 encoded string', async () => {
//       // Return a SignedMessage object instead of a bare Uint8Array.
//       const signMessageSpy = jest
//         .spyOn(universalProviderClient, 'signMessage')
//         .mockResolvedValue({ signature: new Uint8Array([1, 2, 3]) });
//       const message = 'hello world';
//       const signature = await connector.signMessage(message);
//       expect(signMessageSpy).toHaveBeenCalled();
//       const expectedSignature = Buffer.from(new Uint8Array([1, 2, 3])).toString('base64');
//       expect(signature).toEqual(expectedSignature);
//     });
//   });

//   describe('getProvider compatibility', () => {
//     it('should return a provider compatible with ISolana', async () => {
//       await universalProviderClient.init();
//       const provider = connector.findProvider();
//       expect(provider).toBeDefined();
//       if (!provider) throw new Error('Provider is undefined');
//       expect(typeof provider.connect).toBe('function');
//       expect(typeof provider.signMessage).toBe('function');
//       expect(typeof provider.disconnect).toBe('function');
//     });
//   });
// });


import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector';
import { universalProviderClient } from './SolanaUniversalProvider';
import { PublicKey } from '@solana/web3.js';
import { SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';

const walletConnectorProps: SolanaWalletConnectorOpts = {
  walletBook: {} as any,
  solNetworks: [],
} as any as SolanaWalletConnectorOpts;


// Mock the universalProviderClient
jest.mock('./SolanaUniversalProvider', () => ({
  universalProviderClient: {
    init: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    getPublicKey: jest.fn(),
    isConnected: false,
  },
}));

describe('WalletConnectSolanaConnector', () => {
  let connector: WalletConnectSolanaConnector;

  beforeEach(() => {
     connector = new WalletConnectSolanaConnector(walletConnectorProps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('init should initialize the universalProviderClient', async () => {
    await connector.init();
    expect(universalProviderClient.init).toHaveBeenCalled();
  });

  test('connect should call universalProviderClient.connect', async () => {
    await connector.connect();
    expect(universalProviderClient.connect).toHaveBeenCalled();
  });

  test('disconnect should call universalProviderClient.disconnect', async () => {
    await connector.disconnect();
    expect(universalProviderClient.disconnect).toHaveBeenCalled();
  });

  // test('signMessage should call universalProviderClient.signMessage', async () => {
  //   const message = 'Test message';
  //   await connector.signMessage(message);
  //   expect(universalProviderClient.signMessage).toHaveBeenCalledWith(expect.any(Uint8Array));
  // });

  test('getPublicKey should return a PublicKey', async () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    (universalProviderClient.getPublicKey as jest.Mock).mockResolvedValue(mockPublicKey);
    
    const result = await connector.getAddress();
    expect(result).toBeInstanceOf(PublicKey);
    expect(result).toEqual(mockPublicKey);
  });

  // Add more tests for other methods as needed
});