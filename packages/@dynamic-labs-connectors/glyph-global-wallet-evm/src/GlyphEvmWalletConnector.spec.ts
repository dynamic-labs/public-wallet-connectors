/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { GlyphEvmWalletConnector } from './GlyphEvmWalletConnector.js';

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

describe('GlyphEvmWalletConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findProvider', () => {
    it('should return the provider', () => {
      const connector = new GlyphEvmWalletConnector(walletConnectorProps, true);
      expect(connector.findProvider()).toBeDefined();
    });
  });
});
