

import { MetamaskEvmConnectors, MetamaskConnector } from './index.js';

describe('MetamaskEvmConnectors', () => {
  it('should return the MetamaskConnector', () => {
    expect(MetamaskEvmConnectors({})).toEqual([MetamaskConnector]);
  });
});
