// generate test for index.ts
jest.mock('@dynamic-labs/bitcoin', () => ({
  UnisatConnector: class {
    walletConnectorEventsEmitter = {
      emit: jest.fn(),
    };
  },
}));

import { TapWalletConnectors } from './index.js';

describe('TapWalletConnectors', () => {
  it('should return an array', () => {
    expect(TapWalletConnectors({})).toBeInstanceOf(Array);
  });
});
