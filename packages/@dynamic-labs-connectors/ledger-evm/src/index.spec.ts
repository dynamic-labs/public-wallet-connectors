import {
  LedgerEvmWalletConnectors,
  LedgerEvmWalletConnector,
} from './index.js';

describe('LedgerEvmWalletConnectors', () => {
  it('should return the LedgerEvmWalletConnector', () => {
    expect(LedgerEvmWalletConnectors({})).toEqual([LedgerEvmWalletConnector]);
  });
});
