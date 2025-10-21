jest.mock('@dynamic-labs/starknet', () => ({
  StarknetWalletConnector: class {
    walletConnectorEventsEmitter = {
      emit: jest.fn(),
    };
  },
}));

import { XverseStarknetWalletConnectors, XverseStarknetWalletConnector } from './index.js';

describe('XverseStarknetWalletConnectors', () => {
  it('should return an array', () => {
    expect(XverseStarknetWalletConnectors({})).toBeInstanceOf(Array);
  });

  it('should return the XverseStarknetWalletConnector in the array', () => {
    expect(XverseStarknetWalletConnectors({})).toEqual([XverseStarknetWalletConnector]);
  });
});
