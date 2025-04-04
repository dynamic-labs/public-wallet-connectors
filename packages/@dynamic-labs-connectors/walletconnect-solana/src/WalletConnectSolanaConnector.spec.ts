// WalletConnectSolanaConnector.test.ts
import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector';
import { ReownSolanaSdkClient } from './ReownSolanaSdkClient';
import {
    IChainRpcProviders,
    type SolanaWalletConnectorOpts,
  } from "@dynamic-labs/solana-core";
import { env } from 'process';

// Create a manual mock for ReownSolanaSdkClient so we can override its behavior
jest.mock('./ReownSolanaSdkClient', () => ({
  ReownSolanaSdkClient: {
    isInitialized: false,
    init: jest.fn(),
    getProvider: jest.fn(),
    getAddress: jest.fn(),
    // Provide a fake provider that satisfies ReownSolanaProvider's interface
    provider: {
      sdk: {},
      isBackpack: false,
      isPhantom: false,
      isBraveWallet: false,
      isGlow: false,
      isSolflare: false,
      isExodus: false,
      isMagicEden: false,
      isConnected: false,
      publicKey: undefined,
      providers: [],
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
      disconnect: jest.fn(),
      signMessage: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  },
}));

describe('WalletConnectSolanaConnector', () => {
  let connector: WalletConnectSolanaConnector;
  
  const dummyChainRpcProviders: IChainRpcProviders = {
    getSolanaProviderByChainId: (chainId: string): string => "https://dummy.solana.rpc",
    registerSolanaProviders: (providers: Record<string, any>): void => {
      // no-op dummy implementation
    },
    // If the interface requires additional properties or methods,
    // you can add them here as no-op functions or dummy values.
  } as unknown as IChainRpcProviders;
  // Dummy options for the connector – providing the required properties
  const dummyOpts: SolanaWalletConnectorOpts = {
  // Provide a mapping of chain identifiers to RPC endpoints
  chainRpcProviders: dummyChainRpcProviders,
  // Define the supported Solana networks
  solNetworks: [],
  // Include any wallet-specific options or an empty array if not needed
  walletBook: {
    groups: {},
    wallets: {},
  },
};

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset ReownSolanaSdkClient defaults
    ReownSolanaSdkClient.isInitialized = false;
    (ReownSolanaSdkClient.init as jest.Mock).mockResolvedValue(undefined);
    (ReownSolanaSdkClient.getProvider as jest.Mock).mockReturnValue(ReownSolanaSdkClient.provider);
    (ReownSolanaSdkClient.getAddress as jest.Mock).mockResolvedValue('test-address');

    // Create a new instance of the connector
    connector = new WalletConnectSolanaConnector(dummyOpts);
    // Inject a fake event emitter on the connector
    connector.walletConnectorEventsEmitter = { emit: jest.fn() } as any;
  });

  test('should have default properties', () => {
    expect(connector.name).toBe('WalletConnect Solana');
    expect(connector.isWalletConnect).toBe(true);
    expect(connector.supportedChains).toEqual(['SOL']);
  });

  test('init should throw error if projectId is not set', async () => {
    WalletConnectSolanaConnector.projectId = '';
    await expect(connector.init()).rejects.toThrow('WalletConnect projectId not found');
  });

  test('init should do nothing if already initialized', async () => {
    ReownSolanaSdkClient.isInitialized = true;
    WalletConnectSolanaConnector.projectId = env["ENVIRONMENT_ID"] ?? " ";
    await connector.init();
    expect(ReownSolanaSdkClient.init).not.toHaveBeenCalled();
    expect(connector.walletConnectorEventsEmitter.emit).not.toHaveBeenCalled();
  });

  test('init should initialize and emit providerReady event', async () => {
    WalletConnectSolanaConnector.projectId = env["ENVIRONMENT_ID"] ?? " ";
    await connector.init();
    expect(ReownSolanaSdkClient.init).toHaveBeenCalledWith(env["ENVIRONMENT_ID"] ?? " ");
    expect(connector.walletConnectorEventsEmitter.emit).toHaveBeenCalledWith('providerReady', { connector });
  });

  test('supportsNetworkSwitching should return false', () => {
    expect(connector.supportsNetworkSwitching()).toBe(false);
  });

  test('findProvider should call init and return provider', () => {
    const fakeProvider = { id: 'fake-provider' };
    (ReownSolanaSdkClient.getProvider as jest.Mock).mockReturnValue(fakeProvider);
    const provider = connector.findProvider();
    expect(provider).toBe(fakeProvider);
  });

  test('getAddress should initialize and return address', async () => {
    (ReownSolanaSdkClient.getAddress as jest.Mock).mockResolvedValue('fake-address');
    const address = await connector.getAddress();
    expect(address).toBe('fake-address');
  });

  test('getSupportedNetworks should return ["mainnet", "devnet"]', () => {
    expect(connector.getSupportedNetworks()).toEqual(['mainnet', 'devnet']);
  });

  test('getConnectedAccounts should return accounts from the parent method', async () => {
    // Instead of using __proto__, use jest.spyOn to override the parent's method.
    const fakeAccounts = ['account1', 'account2'];
    jest.spyOn(
      Object.getPrototypeOf(WalletConnectSolanaConnector.prototype),
      'getConnectedAccounts'
    ).mockResolvedValue(fakeAccounts);
    const accounts = await connector.getConnectedAccounts();
    expect(accounts).toEqual(fakeAccounts);
  });

  test('signMessage should sign and return the signature', async () => {
    const testMessage = 'Hello, world!';
    // Create an encoded signature that decodes back to "signed-message"
    const encodedSignature = new TextEncoder().encode('signed-message');
    // Mock provider.signMessage to resolve with an object containing the signature
    (ReownSolanaSdkClient.provider.signMessage as jest.Mock).mockResolvedValue({ signature: encodedSignature });
    
    const signature = await connector.signMessage(testMessage);
    expect(ReownSolanaSdkClient.provider.signMessage).toHaveBeenCalled();
    expect(signature).toBe('signed-message');
  });

  test('filter should return boolean based on provider existence', () => {
    // When a provider exists
    (ReownSolanaSdkClient.getProvider as jest.Mock).mockReturnValue({ id: 'provider' });
    expect(connector.filter()).toBe(true);

    // When no provider is found
    (ReownSolanaSdkClient.getProvider as jest.Mock).mockReturnValue(undefined);
    expect(connector.filter()).toBe(false);
  });
});
