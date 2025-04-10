import { UnisatConnector } from '@dynamic-labs/bitcoin';

const TAP_WALLET_NAME = 'Tap Wallet';
const TAP_WALLET_ID = 'tapwallet';
const TAP_WALLET_ICON = 'https://tap.trac.network/tap-logo.png';

export class TapWalletConnector extends UnisatConnector {
  override name = TAP_WALLET_NAME;
  override overrideKey = TAP_WALLET_ID;

  constructor(props: any) {
    super({
      ...props,
      metadata: {
        icon: TAP_WALLET_ICON,
        id: TAP_WALLET_ID,
        name: TAP_WALLET_NAME,
      },
      overrideKey: props.overrideKey ?? TAP_WALLET_ID,
      walletData: {
        injectedConfig: [
          {
            chain: 'btc',
            extensionLocators: [],
            windowLocations: ['tapprotocol'],
          },
        ],
        name: TAP_WALLET_NAME,
      },
    });
  }

  private isTapWalletInstalled(): boolean {
    return Boolean(
      typeof window !== 'undefined' && (window as any).tapprotocol,
    );
  }

  override async init(): Promise<void> {
    if (!this.isTapWalletInstalled()) {
      return;
    }

    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });
  }
  // Ensure only available wallets are listed
  override filter(): boolean {
    return this.isTapWalletInstalled();
  }
}
