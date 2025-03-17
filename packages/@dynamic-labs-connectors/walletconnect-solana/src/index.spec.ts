import { WalletConnectSolanaConnector, } from './index.js';
import type { SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
import { ReownSdkClient } from './ReownSdkClient.js';


jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  ...jest.requireActual('@dynamic-labs/wallet-connector-core'),
  logger: {
    debug: jest.fn(),
  }
}));

const walletConnectorProps: SolanaWalletConnectorOpts = {
  walletBook: {} as any,
  solNetworks: [
    {
      id: 'solanaMainnet',
      // You may add other properties as required by your type,
      // for example: name, rpcUrl, etc.
      name: 'Solana Mainnet'
    }
  ],
  walletConnectProjectId: '650bf06b2ba268309996256ccf0ac529',
  walletConnectMetadata: {
    name: 'Test App',
    description: 'Test Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png']
  }
} as any as SolanaWalletConnectorOpts;

describe('WalletConnectSolanaConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProvider', () => {
    it('should return the provider', () => {
      const connector = new WalletConnectSolanaConnector(walletConnectorProps);
      console.log("WalletConnectSolanaConnector is: ", connector);
      console.log("ReownSdkClient is: ", ReownSdkClient);
      connector.init();
      expect(connector.findProvider()).toBeDefined();
    });
  });
});