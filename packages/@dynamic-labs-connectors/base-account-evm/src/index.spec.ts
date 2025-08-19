/* eslint-disable @typescript-eslint/no-explicit-any */

const providerRequestMock = jest.fn();
const providerMock: any = {
  request: providerRequestMock,
  on: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('./helpers.js', () => ({
  getBaseAccountProvider: jest.fn(() => providerMock),
}));

jest.mock('@dynamic-labs/ethereum-core', () => {
  class EthereumWalletConnectorStub {
    props: any;
    constructor(props: any) {
      this.props = props;
      this.parseAddress = jest.fn((addr: string) => addr.toLowerCase());
      this.setActiveAccount = jest.fn();
      this.getActiveAccount = jest.fn();
      this.getActiveChain = jest.fn();
      this.providersConfig = { httpTransportConfig: {} };
    }
    parseAddress!: (addr: string) => string;
    setActiveAccount!: (addr: string) => void;
    getActiveAccount!: () => any;
    getActiveChain!: () => any;
    providersConfig!: any;
  }

  return {
    EthereumWalletConnector: EthereumWalletConnectorStub,
    chainsMap: {},
  };
});

// Import after mocks
import { createBaseAccountConnector } from './index.js';
import { BaseAccountEvmWalletConnector } from './BaseAccountEvmWalletConnector.js';

describe('createBaseAccountConnector', () => {
  const baseAccountOpts: any = {
    someOption: 'fromFactory',
    anotherOption: 123,
  };

  const instantiationProps: any = {
    walletBook: {},
    evmNetworks: [],
    someOption: 'fromInstantiation',
    extraInstantiationOnly: true,
  };

  it('returns a function that returns an array with a single connector class', () => {
    const factory = createBaseAccountConnector(baseAccountOpts);
    expect(typeof factory).toBe('function');

    const connectors = factory();
    expect(Array.isArray(connectors)).toBe(true);
    expect(connectors.length).toBe(1);
  });

  it('produces a connector class that extends BaseAccountEvmWalletConnector', () => {
    const factory = createBaseAccountConnector(baseAccountOpts);
    const [ConnectorClass] = factory();

    expect(ConnectorClass).toBeDefined();
    if (!ConnectorClass) {
      throw new Error('ConnectorClass is undefined');
    }

    const connector = new ConnectorClass(instantiationProps);
    expect(connector).toBeInstanceOf(BaseAccountEvmWalletConnector);
  });

  it('merges props so that factory options override instantiation props on conflicts', () => {
    const factory = createBaseAccountConnector(baseAccountOpts);
    const [ConnectorClass] = factory();

    expect(ConnectorClass).toBeDefined();
    if (!ConnectorClass) {
      throw new Error('ConnectorClass is undefined');
    }

    const connector = new ConnectorClass(instantiationProps) as BaseAccountEvmWalletConnector & {
      props: any;
    };

    expect(connector.props.someOption).toBe('fromFactory');
    expect(connector.props.anotherOption).toBe(123);
    expect(connector.props.extraInstantiationOnly).toBe(true);
  });
});


