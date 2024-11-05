/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { AbstractEvmWalletConnector } from './AbstractEvmWalletConnector.js';

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
    ...jest.requireActual('@dynamic-labs/wallet-connector-core'),
    logger: {
      debug: jest.fn(),
    }
  }));

const walletConnectorProps: EthereumWalletConnectorOpts = {
    walletBook: {} as any,
    evmNetworks: [],
  } as any as EthereumWalletConnectorOpts;
  

describe('AbstractEvmWalletConnector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    describe('findProvider', () => {
        it('should return the provider', () => {
            const connector = new AbstractEvmWalletConnector(walletConnectorProps);
            expect(connector.findProvider()).toBeDefined();
        });
    });
});