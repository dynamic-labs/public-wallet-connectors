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

const mockEventListeners = {
  handleAccountChange: jest.fn(),
  handleChainChange: jest.fn(),
  handleDisconnect: jest.fn(),
};

jest.mock('@dynamic-labs/wallet-connector-core', () => ({
  logger: {
    error: jest.fn(),
  },
  eventListenerHandlers: jest.fn(() => ({
    handleAccountChange: mockEventListeners.handleAccountChange,
    handleChainChange: mockEventListeners.handleChainChange,
    handleDisconnect: mockEventListeners.handleDisconnect,
  })),
}));

// import after mocks
import { BaseAccountEvmWalletConnector } from './BaseAccountEvmWalletConnector.js';
import { getBaseAccountProvider } from './helpers.js';
import { EthereumWalletConnector } from '@dynamic-labs/ethereum-core';
import { eventListenerHandlers } from '@dynamic-labs/wallet-connector-core';

const walletConnectorProps: any = {
  walletBook: {},
  evmNetworks: [],
};

describe('BaseAccountEvmWalletConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose the Base Account provider via the getter', () => {
    const connector = new BaseAccountEvmWalletConnector(walletConnectorProps);
    const provider = connector.baseAccountProvider;

    expect(getBaseAccountProvider).toHaveBeenCalledTimes(1);
    expect(provider).toBe(providerMock);
  });

  it('getConnectedAccounts should return parsed addresses and set active account', async () => {
    const connector = new BaseAccountEvmWalletConnector(walletConnectorProps);
    providerRequestMock.mockResolvedValueOnce(['0xABCDEF']);

    const accounts = await connector.getConnectedAccounts();

    const parseAddress = (connector as unknown as EthereumWalletConnector).parseAddress as jest.Mock;

    expect(providerRequestMock).toHaveBeenCalledWith({ method: 'eth_accounts' });
    expect(parseAddress).toHaveBeenCalledWith('0xABCDEF');
    expect(accounts).toEqual(['0xabcdef']);

    const setActiveAccount = (connector as unknown as EthereumWalletConnector).setActiveAccount as jest.Mock;
    expect(setActiveAccount).toHaveBeenCalledWith('0xabcdef');
  });

  it('getAddress should return the parsed address and set active account', async () => {
    const connector = new BaseAccountEvmWalletConnector(walletConnectorProps);
    providerRequestMock.mockResolvedValueOnce(['0xABCDEF']);

    const address = await connector.getAddress();

    expect(providerRequestMock).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(address).toBe('0xabcdef');

    const setActiveAccount = (connector as unknown as EthereumWalletConnector).setActiveAccount as jest.Mock;
    expect(setActiveAccount).toHaveBeenCalledWith('0xabcdef');
  });

  it('signMessage should request accounts then sign the message', async () => {
    const connector = new BaseAccountEvmWalletConnector(walletConnectorProps);
    providerRequestMock.mockResolvedValueOnce(['0xABCDEF']);
    providerRequestMock.mockResolvedValueOnce('0xsigned');

    const message = 'hello';
    const signature = await connector.signMessage(message);

    expect(providerRequestMock.mock.calls[0][0]).toEqual({ method: 'eth_requestAccounts' });
    expect(providerRequestMock.mock.calls[1][0]).toHaveProperty('method', 'personal_sign');
    expect(signature).toBe('0xsigned');
  });

  it('setupEventListeners should register and teardown listeners', () => {
    const connector = new BaseAccountEvmWalletConnector(walletConnectorProps);

    connector.setupEventListeners();

    expect(eventListenerHandlers).toHaveBeenCalledWith(connector);

    expect(providerMock.on).toHaveBeenCalledTimes(3);
    expect(providerMock.on).toHaveBeenCalledWith('accountsChanged', mockEventListeners.handleAccountChange);
    expect(providerMock.on).toHaveBeenCalledWith('chainChanged', mockEventListeners.handleChainChange);
    expect(providerMock.on).toHaveBeenCalledWith('disconnect', mockEventListeners.handleDisconnect);

    connector.teardownEventListeners?.();
    expect(providerMock.removeListener).toHaveBeenCalledTimes(3);
    expect(providerMock.removeListener).toHaveBeenCalledWith('accountsChanged', mockEventListeners.handleAccountChange);
    expect(providerMock.removeListener).toHaveBeenCalledWith('chainChanged', mockEventListeners.handleChainChange);
    expect(providerMock.removeListener).toHaveBeenCalledWith('disconnect', mockEventListeners.handleDisconnect);
  });
});
