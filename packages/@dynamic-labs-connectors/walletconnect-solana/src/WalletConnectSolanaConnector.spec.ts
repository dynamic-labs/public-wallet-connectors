/* eslint-disable @typescript-eslint/no-explicit-any */
import { SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  ...jest.requireActual('@dynamic-labs/wallet-connector-core'),
  logger: {
    debug: jest.fn(),
  },
}));

const walletConnectorProps: SolanaWalletConnectorOpts = {
  walletBook: {} as any,
  solNetworks: [],
} as any as SolanaWalletConnectorOpts;

describe('SolanaWalletConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any previously defined window.solana.
    (global as any).window = {};
  });

  describe('findProvider', () => {
    it('should return the provider if window.solana is defined', () => {
      const dummyProvider = {
        publicKey: { toString: () => 'dummy-address' },
        connect: jest.fn(),
        signMessage: jest.fn(),
      };

      // Simulate an injected Solana provider
      (global as any).window = { solana: dummyProvider };

      const connector = new WalletConnectSolanaConnector(walletConnectorProps);
      const provider = connector.findProvider();
      expect(provider).toBeDefined();
      expect(provider).toBe(dummyProvider);
    });

    it('should return undefined if window.solana is not defined', () => {
      // Ensure window.solana is not defined.
      (global as any).window = {};
      const connector = new WalletConnectSolanaConnector(walletConnectorProps);
      expect(connector.findProvider()).toBeUndefined();
    });
  });
});
