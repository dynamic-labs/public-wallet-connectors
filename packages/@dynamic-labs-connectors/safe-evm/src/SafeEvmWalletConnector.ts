import { SafeAppProvider } from '@safe-global/safe-apps-provider';
import SafeAppsSDK, { type SafeInfo } from '@safe-global/safe-apps-sdk';
import { type Hex } from 'viem';

import { logger, type WalletMetadata } from '@dynamic-labs/wallet-connector-core';
import { type EthWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';

class SafeSingleton {
  static onComplete: (() => void) | undefined;

  // this is what we use to fetch the safe wallet data and initialize the provider
  static safeSdk: SafeAppsSDK;

  // this is injected by the safe app
  // it contains the safe wallet data
  static safeInfo: SafeInfo | undefined;

  // this is the eip-1193 provider
  static provider: SafeAppProvider;

  private constructor() {
    // do nothing
  }

  static initSafe = async () => {
    logger.debug('[SafeEvmWalletConnector] initSafe - initializing sdk');

    SafeSingleton.safeSdk = new SafeAppsSDK();

    logger.debug('[SafeEvmWalletConnector] initSafe - sdk initialized');

    SafeSingleton.safeInfo = await Promise.race([
      SafeSingleton.safeSdk.safe.getInfo(),
      new Promise<undefined>((resolve) => setTimeout(resolve, 1000)),
    ]);

     // this happens when:
    //  1. the user is actually in safe but we were unable to load the safe sdk or wallet for some reason
    //  2. the user is in some other iframe that is not safe
    if (!SafeSingleton.safeInfo) {
      logger.debug(
        '[SafeEvmWalletConnector] initSafe - unable to load safe data',
      );
      return;
    }

    logger.debug('[SafeEvmWalletConnector] initSafe - initializing provider');

    SafeSingleton.provider = new SafeAppProvider(
      SafeSingleton.safeInfo,
      SafeSingleton.safeSdk,
    );

    logger.debug('[SafeEvmWalletConnector] initSafe - provider initialized');
  };

  static async init({ onComplete }: { onComplete: () => void }) {
    logger.debug('[SafeEvmWalletConnector] init');

    SafeSingleton.onComplete = onComplete;

    if (!SafeSingleton.safeSdk) {
      await SafeSingleton.initSafe();
      SafeSingleton.onComplete();
      logger.debug('[SafeEvmWalletConnector] init completed');
    }
  }
}

export class SafeEvmWalletConnector extends EthereumInjectedConnector {
  static metadata: WalletMetadata = { id: 'safe' };

  override name = 'Safe';

  constructor(props: EthWalletConnectorOpts) {
    super(props);

    this.wallet = findWalletBookWallet(this.walletBook, this.key);

    SafeSingleton.init({ onComplete: this.onProviderReady });
  }
  
  private onProviderReady = () => {
    logger.debug('[SafeEvmWalletConnector] onProviderReady');

    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });

    this.tryAutoConnect();
  };

  private async tryAutoConnect() {
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

    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }

  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): IEthereum | undefined {
    return SafeSingleton.provider as unknown as IEthereum;
  }

  override async getAddress(): Promise<string | undefined> {
    return SafeSingleton.safeInfo?.safeAddress;
  }

  override async getConnectedAccounts(): Promise<string[]> {
    const connectedAccount = await this.getAddress();

    if (!connectedAccount) {
      return [];
    }

    this.setActiveAccount(connectedAccount as Hex);

    return [connectedAccount];
  }

  override async signMessage(
    messageToSign: string,
  ): Promise<string | undefined> {
    const client = this.getWalletClient();

    if (!client) {
      return undefined;
    }

    return client.signMessage({
      message: messageToSign,
    });
  }

  // this will ensure the connectors is not added to the available connectors list if the provider
  // is not ready and it will only be added when the providerReady event is emitted
  override filter(): boolean {
    return Boolean(SafeSingleton.provider);
  }

  override get key(): string {
    return SafeEvmWalletConnector.metadata.id;
  }
}
