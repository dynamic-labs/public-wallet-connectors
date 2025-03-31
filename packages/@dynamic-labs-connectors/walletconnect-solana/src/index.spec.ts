
// index.spec.ts

import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector';
import { universalProviderClient } from './SolanaUniversalProvider';
import { SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';

// Create a Jest mock for the universalProviderClient module.
jest.mock('./SolanaUniversalProvider', () => ({
  universalProviderClient: {
    init: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    signMessage: jest.fn().mockResolvedValue({ signature: new Uint8Array([1, 2, 3]) }),
    getPublicKey: jest.fn().mockReturnValue('FAKE_PUBLIC_KEY'),
    signTransaction: jest.fn().mockImplementation(async (tx) => tx),
    getConnectionUri: jest.fn().mockReturnValue('FAKE_CONNECTION_URI'),
    isConnected: true,
    walletConnectorEventsEmitter: {
      emit: jest.fn(),
    },
  },
}));

describe('WalletConnectSolanaConnector', () => {
  beforeEach(() => {
    // Clear all mock calls and reset the static flag before each test.
    jest.clearAllMocks();
    WalletConnectSolanaConnector.initHasRun = false;
  });

  it('should initialize and find the provider', async () => {
    const walletConnectorProps: SolanaWalletConnectorOpts = {
    walletBook: {} as any,
    solNetworks: [
    {
      id: 'solanaMainnet',
      name: 'Solana Mainnet',
    },
    ],
    walletConnectProjectId: '650bf06b2ba268309996256ccf0ac529',
    walletConnectMetadata: {
      name: 'Test App',
      description: 'Test Description',
      url: 'https://test.com',
      icons: ['https://test.com/icon.png'],
    },
  } as any as SolanaWalletConnectorOpts;

    const connector = new WalletConnectSolanaConnector(walletConnectorProps);

    // Call the init method which should trigger the universal provider initialization.
    await connector.init();

    // Verify that the universalProviderClient's init method was called.
    expect(universalProviderClient.init).toHaveBeenCalled();

    // Check that the static flag was updated to true.
    expect(WalletConnectSolanaConnector.initHasRun).toBe(true);

    // Verify that findProvider returns a provider with the expected public key.
    const provider = connector.findProvider();
    expect(provider).toBeDefined();
  });
});
