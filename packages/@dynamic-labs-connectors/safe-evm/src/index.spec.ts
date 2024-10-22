import { isInIframe } from '@dynamic-labs/utils';

import { SafeEvmWalletConnector, SafeEvmWalletConnectors } from './index';

// mocking since it was causing issues
jest.mock('@dynamic-labs/embedded-wallet-evm', () => ({
  TurnkeyEVMWalletConnectors: [],
}));

jest.mock('@dynamic-labs/utils');

const isInIframeMock = isInIframe as jest.Mock;

describe('SafeEvmWalletConnectors', () => {
  it('should return an empty array if not in an iframe', () => {
    isInIframeMock.mockReturnValue(false);
    expect(SafeEvmWalletConnectors({})).toEqual([]);
  });

  it('should return the SafeEvmWalletConnector if in an iframe', () => {
    isInIframeMock.mockReturnValue(true);
    expect(SafeEvmWalletConnectors({})).toEqual([SafeEvmWalletConnector]);
  });
});
