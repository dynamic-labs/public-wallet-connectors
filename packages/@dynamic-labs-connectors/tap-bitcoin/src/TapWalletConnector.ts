import {
  type BitcoinTransaction,
  UnisatConnector,
} from '@dynamic-labs/bitcoin';


const TAP_WALLET_NAME = 'Tap Wallet';
const TAP_WALLET_ID = 'tapwallet';
const TAP_WALLET_ICON = 'https://tap.trac.network/tap-logo.png';
import bitcoinjsLib from 'bitcoinjs-lib';

export class TapWalletConnector extends UnisatConnector {
  override name = TAP_WALLET_NAME;
  override overrideKey = TAP_WALLET_ID;

  constructor(props) {
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

  override async getAddress(): Promise<string | undefined> {
    const provider = this.getProvider();
    if (!provider) return;
    const [address] = await provider.requestAccounts();
    await this.setConnectedAccountWithAddresses({
      active: true,
      mainAddress: address,
      ordinalsAddress: { address, publicKey: await provider.getPublicKey() },
    });
    return address;
  }

  override async signMessage(
    messageToSign: string,
  ): Promise<string | undefined> {
    const provider = this.getProvider();
    if (!provider) return;
    return await provider.signMessage(messageToSign);
  }

  override async sendBitcoin(
    transaction: BitcoinTransaction,
  ): Promise<string | undefined> {
    const provider = this.getProvider();
    const connectedAddress = await this.getAddress();
    if (!connectedAddress || !provider) return;
    return await provider.sendBitcoin(
      transaction.recipientAddress,
      Number(transaction.amount),
    );
  }

  override async signPsbt(
    request: any,
  ): Promise<{ signedPsbt: string } | undefined> {
    const provider = this.getProvider();
    if (!provider) return;
    const psbtFromBase64 = bitcoinjsLib.Psbt.fromBase64(
      request.unsignedPsbtBase64,
    );
    const signedPsbtHex = await provider.signPsbt(psbtFromBase64.toHex());
    return { signedPsbt: bitcoinjsLib.Psbt.fromHex(signedPsbtHex).toBase64() };
  }

  override async signPsbts(requests: any): Promise<string[] | undefined> {
    const provider = this.getProvider();
    if (!provider) return;
    const psbtHexs = requests.map((req: any) =>
      bitcoinjsLib.Psbt.fromBase64(req.unsignedPsbtBase64).toHex(),
    );
    const signedPsbtHexs = await provider.signPsbts(psbtHexs);
    return signedPsbtHexs.map((hex: string) =>
      bitcoinjsLib.Psbt.fromHex(hex).toBase64(),
    );
  }

  override async getConnectedAccounts(): Promise<string[]> {
    const provider = this.getProvider();
    return provider ? await provider.getAccounts() : [];
  }

  override isInstalledOnBrowser(): boolean {
    return Boolean(this.getProvider());
  }

  override getProvider(): any {
    if (typeof window === 'undefined' || !(window as any).tapprotocol) {
      return;
    }

    return (window as any).tapprotocol;
  }

  // Ensure only available wallets are listed
  override filter(): boolean {
    return this.isTapWalletInstalled();
  }
}
