jest.mock('@dynamic-labs/starknet', () => ({
  StarknetWalletConnector: class {
    walletConnectorEventsEmitter = {
      emit: jest.fn(),
    };
  },
}));

import { XverseWalletConnectors } from './index.js';

describe('XverseWalletConnectors', () => {
  it('should return an array', () => {
    expect(XverseWalletConnectors({})).toBeInstanceOf(Array);
  });
});
