import { BitcoinWalletConnector } from '@dynamic-labs/bitcoin';
import bitcoinjsLib from 'bitcoinjs-lib';

export class TapConnector extends BitcoinWalletConnector {
  override name = 'Tap Wallet';
  override overrideKey = 'tap-wallet';

  constructor(props: any) {
    super({
      ...props,
      metadata: {
        id: "tap-wallet",
        name: "Tap Wallet",
        icon: "https://tap.trac.network/tap-logo.png",
      },
    });
  }

   // Initialize the wallet (can be used to check if extension is installed)
   override async init(): Promise<void> {
    if (typeof window !== "undefined" && (window as any).tapprotocol) {
      this.walletConnectorEventsEmitter.emit("providerReady", { connector: this });
    }
  }


  getConnectorName() {
    return `${this.name.replace(' ', '')}Connector`;
  }

  override async getAddress(): Promise<string | undefined> {
    const provider = this.findProvider();
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
    const provider = this.findProvider();
    if (!provider) return;
    return await provider.signMessage(messageToSign);
  }

  override async sendBitcoin(transaction: any): Promise<string | undefined> {
    const provider = this.findProvider();
    const connectedAddress = await this.getAddress();
    if (!connectedAddress || !provider) return;
    return await provider.sendBitcoin(
      transaction.recipientAddress,
      Number(transaction.amount),
    );
  }

  async signPsbt(request: any): Promise<{ signedPsbt: string } | undefined> {
    const provider = this.findProvider();
    if (!provider) return;
    const psbtFromBase64 = bitcoinjsLib.Psbt.fromBase64(
      request.unsignedPsbtBase64,
    );
    const signedPsbtHex = await provider.signPsbt(psbtFromBase64.toHex());
    return { signedPsbt: bitcoinjsLib.Psbt.fromHex(signedPsbtHex).toBase64() };
  }

  override async signPsbts(requests: any): Promise<any> {
    const provider = this.findProvider();
    if (!provider) return;
    const psbtHexs = requests.map((req) =>
      bitcoinjsLib.Psbt.fromBase64(req.unsignedPsbtBase64).toHex(),
    );
    const signedPsbtHexs = await provider.signPsbts(psbtHexs);
    return signedPsbtHexs.map((hex: string) =>
      bitcoinjsLib.Psbt.fromHex(hex).toBase64(),
    );
  }

  override async getConnectedAccounts(): Promise<string[]> {
    const provider = this.findProvider();
    return provider ? await provider.getAccounts() : [];
  }

  // Check if provider is available
  findProvider(): any {
    return typeof window !== 'undefined'
      ? (window as any).tapprotocol
      : undefined;
  }

  // Ensure only available wallets are listed
  override filter(): boolean {
    return Boolean(this.findProvider());
  }
}
