import { isInIframe } from '@dynamic-labs/utils';

import {
  LedgerEvmWalletConnectors,
  LedgerEvmWalletConnector,
} from './index.js';

jest.mock('@dynamic-labs/utils');

const isInIframeMock = isInIframe as jest.Mock;

describe('LedgerEvmWalletConnectors', () => {
  it('should return an empty array if not in an iframe', () => {
    isInIframeMock.mockReturnValue(false);
    expect(LedgerEvmWalletConnectors({})).toEqual([]);
  });

  it('should return the LedgerEvmWalletConnector if in an iframe', () => {
    isInIframeMock.mockReturnValue(true);
    expect(LedgerEvmWalletConnectors({})).toEqual([LedgerEvmWalletConnector]);
  });
});
