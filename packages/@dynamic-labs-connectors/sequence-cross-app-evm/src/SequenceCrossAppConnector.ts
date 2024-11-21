import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import {
  EthereumInjectedConnector,
  type IEthereum,
} from '@dynamic-labs/ethereum';
import { DynamicError } from '@dynamic-labs/utils';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';
import { toHex } from 'viem';

import { SequenceWaasTransportProvider } from './SequenceWaasTransportProvider.js';

export type CrossAppTransportConfig = {
  projectAccessKey: string;
  walletUrl: string;
  initialChainId: number;
};

export class SequenceCrossAppConnector extends EthereumInjectedConnector {
  private walletName: string;

  private nodesUrl = 'https://nodes.sequence.app';

  sequenceWaasTransportProvider: SequenceWaasTransportProvider;

  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override get name() {
    return this.walletName;
  }

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(
    props: EthereumWalletConnectorOpts & {
      transportConfig: CrossAppTransportConfig;
    },
  ) {
    super(props);

    if (!props.metadata?.id) {
      throw new Error('Metadata prop id is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.walletName = props.metadata!.id;

    this.sequenceWaasTransportProvider = new SequenceWaasTransportProvider(
      props.transportConfig.projectAccessKey,
      props.transportConfig.walletUrl,
      props.transportConfig.initialChainId,
      this.nodesUrl,
    );

    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }

  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override isInstalledOnBrowser(): boolean {
    return true;
  }

  override findProvider(): IEthereum | undefined {
    return this.sequenceWaasTransportProvider as unknown as IEthereum;
  }

  override async signMessage(message: string): Promise<string> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('No provider found');
    }
    const address = await this.getAddress();
    return (await provider.request({
      method: 'personal_sign',
      params: [toHex(message), address],
    })) as unknown as string;
  }

  override endSession(): Promise<void> {
    this.sequenceWaasTransportProvider.disconnect();
    return Promise.resolve();
  }
}
