import { SafeAppProvider } from '@safe-global/safe-apps-provider';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';
import { Hex } from 'viem';

import {
  logger,
  walletConnectorEvents,
} from '@dynamic-labs/wallet-connector-core';
import { EthWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, IEthereum } from '@dynamic-labs/ethereum';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';

export class SafeEvmWalletConnector extends EthereumInjectedConnector {
  override name = 'Safe Wallet';
  override overrideKey = 'safe';

  // this is what we use to fetch the safe wallet data and initialize the provider
  private sdk: SafeAppsSDK;

  // this is injected by the safe app
  // it contains the safe wallet data
  private safe?: SafeInfo;

  // this is the eip-1193 provider
  private provider?: SafeAppProvider;

  private triedToConnect = false;
  private isInitializing = false;

  constructor(props: EthWalletConnectorOpts) {
    super(props);

    this.wallet = findWalletBookWallet(this.walletBook, this.key);
    this.sdk = new SafeAppsSDK();

    this.initProvider();
  }

  private async initProvider() {
    logger.debug('[SafeEvmWalletConnector] initProvider');

    if (this.provider || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    if (!this.safe && !this.triedToConnect) {
      this.safe = await this.initializeSafe();
    }

    // this happens when:
    //  1. the user is actually in safe but we were unable to load the safe sdk or wallet for some reason
    //  2. the user is in some other iframe that is not safe
    if (!this.safe) {
      logger.debug('[SafeEvmWalletConnector] unable to load safe');
      return;
    }

    this.provider = new SafeAppProvider(this.safe, this.sdk);

    this.isInitializing = false;

    logger.debug('[SafeEvmWalletConnector] providerReady');
    walletConnectorEvents.emit('providerReady', {
      connector: this,
    });

    this.tryAutoConnect();
  }

  private tryAutoConnect() {
    logger.debug(
      '[SafeEvmWalletConnector] trying to auto connect',
      this.safe?.safeAddress
    );

    if (!this.safe?.safeAddress) {
      return;
    }

    walletConnectorEvents.emit('autoConnect', {
      connector: this,
    });
  }

  private async initializeSafe(): Promise<SafeInfo | undefined> {
    this.triedToConnect = true;

    const safe = await Promise.race([
      this.sdk.safe.getInfo(),
      new Promise<undefined>((resolve) => setTimeout(resolve, 1000)),
    ]);

    return safe;
  }

  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): IEthereum | undefined {
    return this.provider as unknown as IEthereum;
  }

  override async getAddress(): Promise<string | undefined> {
    return this.safe?.safeAddress;
  }

  override async getConnectedAccounts(): Promise<string[]> {
    if (!this.safe?.safeAddress) {
      return [];
    }

    this.setActiveAccount(this.safe.safeAddress as Hex);

    return [this.safe.safeAddress];
  }

  override async signMessage(
    messageToSign: string
  ): Promise<string | undefined> {
    const client = this.getWalletClient();

    if (!client) {
      return undefined;
    }

    return client.signMessage({
      message: messageToSign,
    });
  }
}
