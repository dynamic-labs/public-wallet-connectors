import { type Hex } from 'viem';

import { logger } from '@dynamic-labs/wallet-connector-core';
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import {
  EthereumInjectedConnector,
  type IEthereum,
} from '@dynamic-labs/ethereum';
import { LedgerSdkClient } from './LedgerSdkClient.js';

export class LedgerEvmWalletConnector extends EthereumInjectedConnector {
  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override name = 'Ledger Live';

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'ledger',
        name: 'Ledger Live',
        icon: 'https://images.ctfassets.net/8hg3kqocu2n7/5CG2RfiNCLMHLgRdjVKokD/69bf487cfd5cd72a6500bba3e9233d30/LEDGER-WORDMARK-SINGLE-CHARACTER-WHITE-BLACK-CMYK-01.png',
      },
    });
  }

  /**
   * Initializes the Ledger provider and emits the providerReady event
   * @override Required override from the base connector class
   */
  override async init(): Promise<void> {
    // This method can be called multiple times, but we should only
    // initialize the provider and emit the providerReady event once
    if (LedgerSdkClient.isInitialized) {
      return;
    }

    await LedgerSdkClient.init();
    this.onProviderReady();
  }

  private onProviderReady = (): void => {
    logger.debug('[LedgerEvmWalletConnector] onProviderReady');

    // Emits the providerReady event so the sdk knows it's available
    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });

    // Tries to auto connect to the ledger wallet
    this.tryAutoConnect();
  };

  private async tryAutoConnect(): Promise<void> {
    const address = await this.getAddress();

    logger.debug(
      '[LedgerEvmWalletConnector] tryAutoConnect - address:',
      address,
    );

    if (!address) {
      logger.debug(
        '[LedgerEvmWalletConnector] tryAutoConnect - no address to connect',
        address,
      );
      return;
    }

    // If there's an address, emit the autoConnect event
    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }

  override findProvider(): IEthereum | undefined {
    return LedgerSdkClient.getProvider();
  }

  /**
   * Returns the address of the connected ledger wallet
   */
  override async getAddress(): Promise<string | undefined> {
    return LedgerSdkClient.getAddress();
  }

  /**
   * Returns the connected accounts
   */
  override async getConnectedAccounts(): Promise<string[]> {
    const connectedAccount = await this.getAddress();

    if (!connectedAccount) {
      return [];
    }

    this.setActiveAccount(connectedAccount as Hex);

    return [connectedAccount];
  }

  /**
   * Signs a message
   */
  override async signMessage(
    messageToSign: string,
  ): Promise<string | undefined> {
    let hexMessage = messageToSign;

    // If not hex string, convert it to hex
    if (!/^0x[0-9a-fA-F]+$/.test(messageToSign)) {
      hexMessage = `0x${Buffer.from(messageToSign).toString('hex')}`;
    }

    try {
      const signature = await LedgerSdkClient.getProvider().request({
        method: 'personal_sign',
        params: [hexMessage, this.getActiveAccount()?.address],
      });

      return signature as unknown as string;
    } catch (error) {
      logger.error('[LedgerEvmWalletConnector] signMessage failed', error);
      return undefined;
    }
  }

  /**
   * This will ensure the connector is not added to the available connectors list if the provider
   * is not ready and it will only be added when the providerReady event is emitted
   */
  override filter(): boolean {
    return Boolean(LedgerSdkClient.getProvider());
  }
}
