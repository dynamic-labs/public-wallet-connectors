import { type Hex } from 'viem';

import { logger } from '@dynamic-labs/wallet-connector-core';
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';
import { SafeSdkClient } from './SafeSdkClient.js';

export class SafeEvmWalletConnector extends EthereumInjectedConnector {
  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override name = 'Safe';

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'safe',
        name: 'Safe',
        icon: 'https://iconic.dynamic-static-assets.com/icons/sprite.svg#safe',
      },
    });

    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }

  /**
   * Initializes the Safe provider and emits the providerReady event
   * @override Required override from the base connector class
   */
  override async init(): Promise<void> {
    // This method can be called multiple times, but we should only
    // initialize the provider and emit the providerReady event once
    if (SafeSdkClient.isInitialized) {
      return;
    }

    await SafeSdkClient.init();
    this.onProviderReady();
  }

  private onProviderReady = (): void => {
    logger.debug('[SafeEvmWalletConnector] onProviderReady');

    // Emits the providerReady event so the sdk knows it's available
    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });

    // Tries to auto connect to the safe wallet
    this.tryAutoConnect();
  };

  private async tryAutoConnect(): Promise<void> {
    const safeAddress = await this.getAddress();

    logger.debug(
      '[SafeEvmWalletConnector] tryAutoConnect - address:',
      safeAddress,
    );

    if (!safeAddress) {
      logger.debug(
        '[SafeEvmWalletConnector] tryAutoConnect - no address to connect',
        safeAddress,
      );
      return;
    }

    // If there's an address, emit the autoConnect event
    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }

  /**
   * Returns false because network switching doesn't work inside the safe app
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): IEthereum | undefined {
    return SafeSdkClient.getProvider();
  }

  /**
   * Returns the address of the connected safe wallet
   */
  override async getAddress(): Promise<string | undefined> {
    return SafeSdkClient.getAddress();
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
  override async signMessage(messageToSign: string): Promise<string | undefined> {
    const client = this.getWalletClient();

    if (!client) {
      return undefined;
    }

    return client.signMessage({
      message: messageToSign,
    });
  }

  /**
   * This will ensure the connector is not added to the available connectors list if the provider
   * is not ready and it will only be added when the providerReady event is emitted
   */
  override filter(): boolean {
    return Boolean(SafeSdkClient.getProvider());
  }
}