import {
  // eslint-disable-next-line import/named
  BitcoinTransaction,
  BitcoinWalletConnector,
} from '@dynamic-labs/bitcoin';
import bitcoinjsLib from 'bitcoinjs-lib';
import { BitcoinWalletConnectorOpts } from 'node_modules/@dynamic-labs/bitcoin/src/connectors';
import {
  BitcoinSignProtocol,
  SignPsbtOptions,
} from 'node_modules/@dynamic-labs/bitcoin/src/types';

export interface TapProvider {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<string>;
  switchNetwork: (network: string) => Promise<void>;
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  signMessage: (message: string, type?: BitcoinSignProtocol) => Promise<string>;
  signPsbt: (psbtHex: string, options: SignPsbtOptions) => Promise<string>;
  signPsbts: (
    psbtHexs: string[],
    options: SignPsbtOptions[],
  ) => Promise<string[]>;
  pushPsbt: (psbtHex: string) => Promise<string>;
}

export class TapWalletConnector extends BitcoinWalletConnector {
  override name = 'Tap Wallet';
  override overrideKey = 'tap-wallet';

  constructor(props: BitcoinWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'tap-wallet',
        name: 'Tap Wallet',
        icon: 'https://tap.trac.network/tap-logo.png',
      },
    });
  }

  // Initialize the wallet (can be used to check if extension is installed)
  override async init(): Promise<void> {
    console.log('🚀 ~ TapWalletConnector ~ overrideinit ~ init:');
    if (typeof window !== 'undefined' && (window as any).tapprotocol) {
      this.walletConnectorEventsEmitter.emit('providerReady', {
        connector: this,
      });
    }
  }

  getConnectorName() {
    return `${this.name.replace(' ', '')}Connector`;
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

  // Check if provider is available
  // override getProvider<T>(): TapProvider &
  //   EventEmitter<string | symbol, any> {
  //   if (typeof window === 'undefined' || !(window as any).tapprotocol) {
  //     throw new Error("TapProvider is not available");
  //   }

  //   const provider = (window as any).tapprotocol as T &
  //     EventEmitter<string | symbol, any>;

  //   // // Ensure provider extends EventEmitter
  //   // if (!(provider instanceof EventEmitter)) {
  //   //   Object.setPrototypeOf(provider, EventEmitter.prototype);
  //   // }

  //   return provider;
  // }

  override isInstalledOnBrowser(): boolean {
    return Boolean(this.getProvider());
  }

  override getProvider(): any {
    if (typeof window === 'undefined' || !(window as any).tapprotocol) {
      return;
    }

    return (window as any).tapprotocol as TapProvider;
  }

  // Ensure only available wallets are listed
  override filter(): boolean {
    return Boolean(this.getProvider());
  }
}
