/* eslint-disable @typescript-eslint/no-explicit-any */
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { SequenceCrossAppConnector } from './SequenceCrossAppConnector.js';
import { SequenceWaasTransportProvider } from './SequenceWaasTransportProvider.js';

jest.mock('./SequenceWaasTransportProvider.js');

const mockTransportConfig = {
  projectAccessKey: 'test-key',
  walletUrl: 'https://test.url',
  initialChainId: 1,
};

const walletConnectorProps: EthereumWalletConnectorOpts & {
  transportConfig: typeof mockTransportConfig;
} = {
  walletBook: {} as any,
  evmNetworks: [],
  metadata: { id: 'sequence' },
  transportConfig: mockTransportConfig,
} as any;

describe('SequenceCrossAppConnector', () => {
  let connector: SequenceCrossAppConnector;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the transport provider
    (SequenceWaasTransportProvider as jest.Mock).mockImplementation(() => ({
      disconnect: jest.fn(),
    }));

    connector = new SequenceCrossAppConnector(walletConnectorProps);
  });

  describe('constructor', () => {
    it('should initialize with correct name', () => {
      expect(connector.name).toBe('sequence');
    });

    it('should throw error if metadata.id is not provided', () => {
      const propsWithoutId = {
        ...walletConnectorProps,
        metadata: {},
      };

      expect(
        () => new SequenceCrossAppConnector(propsWithoutId as any),
      ).toThrow('Metadata prop id is required');
    });

    it('should initialize SequenceWaasTransportProvider with correct params', () => {
      expect(SequenceWaasTransportProvider).toHaveBeenCalledWith(
        mockTransportConfig.projectAccessKey,
        mockTransportConfig.walletUrl,
        mockTransportConfig.initialChainId,
        'https://nodes.sequence.app',
      );
    });

    it('should throw error if transportConfig is not provided', () => {
      const propsWithoutConfig = {
        ...walletConnectorProps,
        transportConfig: undefined,
      };

      expect(
        () => new SequenceCrossAppConnector(propsWithoutConfig as any),
      ).toThrow();
    });
  });

  describe('supportsNetworkSwitching', () => {
    it('should return true', () => {
      expect(connector.supportsNetworkSwitching()).toBe(true);
    });
  });

  describe('isInstalledOnBrowser', () => {
    it('should return true', () => {
      expect(connector.isInstalledOnBrowser()).toBe(true);
    });
  });

  describe('findProvider', () => {
    it('should return the sequenceWaasTransportProvider', () => {
      const provider = connector.findProvider();
      expect(provider).toBe(connector.sequenceWaasTransportProvider);
    });
  });

  describe('endSession', () => {
    it('should call disconnect on the transport provider', async () => {
      await connector.endSession();
      expect(
        connector.sequenceWaasTransportProvider.disconnect,
      ).toHaveBeenCalled();
    });
  });
});
