import { type Hex } from 'viem';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { IntersendSdkClient } from './IntersendSdkClient.js';

export class IntersendEvmWalletConnector extends EthereumInjectedConnector {
  override name = 'Intersend';

  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'intersend',
        name: 'Intersend',
        icon: 'https://storage.googleapis.com/external-assets-intersend/Emblem.png',
      },
    });

  }

  override async init(): Promise<void> {
    if (IntersendSdkClient.isInitialized) {
      return;
    }

    await IntersendSdkClient.init();
    this.onProviderReady();
  }

  private onProviderReady = (): void => {
    logger.debug('[IntersendEvmWalletConnector] onProviderReady');

    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });

    this.tryAutoConnect();
  };

  private async tryAutoConnect(): Promise<void> {
    const address = await this.getAddress();

    logger.debug(
      '[IntersendEvmWalletConnector] tryAutoConnect - address:',
      address,
    );

    if (!address) {
      logger.debug(
        '[IntersendEvmWalletConnector] tryAutoConnect - no address to connect',
      );
      return;
    }

    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }

  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): IEthereum | undefined {
    return IntersendSdkClient.getProvider();
  }

  override isInstalledOnBrowser(): boolean {
    return true;
  }

  override async getAddress(): Promise<string | undefined> {
    return IntersendSdkClient.getAddress();
  }

  override async getConnectedAccounts(): Promise<string[]> {
    const connectedAccount = await this.getAddress();

    if (!connectedAccount) {
      return [];
    }

    this.setActiveAccount(connectedAccount as Hex);

    return [connectedAccount];
  }

  override async signMessage(messageToSign: string): Promise<string | undefined> {
    const client = this.getWalletClient();

    if (!client) {
      return undefined;
    }

    return client.signMessage({
      message: messageToSign,
    });
  }

  override filter(): boolean {
    return Boolean(IntersendSdkClient.getProvider());
  }
}