import { isInIframe } from '@dynamic-labs/utils';
import { IntersendEvmWalletConnectors, IntersendEvmWalletConnector } from './index';

jest.mock('@dynamic-labs/utils');

const isInIframeMock = isInIframe as jest.Mock;

describe('IntersendEvmWalletConnectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array if not in an iframe', () => {
    isInIframeMock.mockReturnValue(false);
    expect(IntersendEvmWalletConnectors({})).toEqual([]);
  });

  it('should return the IntersendEvmWalletConnector if in an iframe', () => {
    isInIframeMock.mockReturnValue(true);
    expect(IntersendEvmWalletConnectors({})).toEqual([IntersendEvmWalletConnector]);
  });
});