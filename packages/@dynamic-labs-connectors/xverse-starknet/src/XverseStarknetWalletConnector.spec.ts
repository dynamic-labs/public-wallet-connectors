jest.mock('@dynamic-labs/starknet', () => ({
  StarknetWalletConnector: class {
    name: string | undefined;
    overrideKey: string | undefined;
    id: string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    constructor(name: string, id: string, key: string, _opts: any) {
      this.name = name;
      this.id = id;
      this.overrideKey = key;
    }

    walletConnectorEventsEmitter = {
      emit: jest.fn(),
    };
    logger = {
      debug: jest.fn(),
    };
    walletData = undefined;
    wallet = undefined;
    setupEventListeners = jest.fn();
  },
}));

jest.mock('starknetkit', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('starknetkit/injected', () => ({
  InjectedConnector: jest.fn(),
}));

import { XverseStarknetWalletConnector } from './XverseStarknetWalletConnector.js';

describe('XverseStarknetWalletConnector', () => {
  let connector: XverseStarknetWalletConnector;

  beforeEach(() => {
    jest.clearAllMocks();
    connector = new XverseStarknetWalletConnector({});
  });

  it('should be defined', () => {
    expect(connector).toBeDefined();
  });

  it('should have correct name', () => {
    expect(connector.name).toBe('Xverse');
  });

  it('should have correct overrideKey', () => {
    expect(connector.overrideKey).toBe('xversestarknet');
  });
});
