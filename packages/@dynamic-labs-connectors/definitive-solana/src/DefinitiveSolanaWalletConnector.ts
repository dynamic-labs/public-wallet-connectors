import { type SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
import { SolanaInjectedConnector } from '@dynamic-labs/solana';
import type { ISolana } from '@dynamic-labs/solana-core';
import { DynamicError } from '@dynamic-labs/utils';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';


// This file mimics the structure of the Abstract EVM connector but for Solana.
// It assumes that a Solana wallet provider (like Phantom) is injected on window.solana.
export class DefinitiveSolanaWalletConnector extends SolanaInjectedConnector {
  /**
   * Unique identifier for this wallet connector.
   */
  id = 'walletConnect-solana';

  /**
   * Display name for the wallet.
   */
  override name = 'WalletConnect Solana';

  /**
   * URL to the wallet's icon.
   */
  iconUrl = 'https://example.com/path/to/definitive-solana-icon.png';

  /**
   * Background color for the icon.
   */
  iconBackground = '#ffffff';

  /**
   * Mobile deep-link configuration.
   */
  // mobile = {
  //   deepLink: 'definitivewallet://connect',
  // };

  /**
   * QR code configuration.
   */
  // qrCode = {
  //   url: 'https://example.com/definitive-solana-qrcode',
  // };

  /**
   * Browser extension configuration.
   */
  // extension = {
  //   installUrl: 'https://chrome.google.com/webstore/detail/definitive-wallet',
  // };

  // Array to store supported Solana networks from connector options.
  solanaNetworks: any[];

  // A flag to ensure initialization happens only once.
  static initHasRun = false;

  // Property to store the connected wallet address.
  activeAccount?: string;

  /**
   * The constructor accepts options and sets metadata.
   */
  constructor(props: SolanaWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'definitive-solana',
        name: 'Definitive Solana',
        icon: 'https://example.com/path/to/definitive-solana-icon.png',
      },
      // Ensure required walletBook property is present.
      walletBook: props.walletBook ?? { groups: [], wallets: [] },
    });

    this.solanaNetworks = [];
    if (props.solNetworks) {
      // Filter the provided networks to only include those supported by this connector.
      for (const network of props.solNetworks) {
        const net = network as any;
        if (net.id === 'solanaDevnet' || net.id === 'solanaMainnet') {
          this.solanaNetworks.push(network);
        }
      }
    }
  }

  /**
   * Indicates that network switching is not supported.
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  /**
   * Indicates that the wallet is assumed to be installed in the browser.
   */
  override isInstalledOnBrowser(): boolean {
    return true;
  }

  /**
   * Initializes the connector.
   * Ensures initialization is run only once and emits the providerReady event.
   */
  override async init(): Promise<void> {
    if (DefinitiveSolanaWalletConnector.initHasRun) {
      return;
    }
    if (this.solanaNetworks.length === 0) {
      return;
    }
    DefinitiveSolanaWalletConnector.initHasRun = true;
    logger.debug('[DefinitiveSolanaWalletConnector] onProviderReady');
    this.walletConnectorEventsEmitter.emit('providerReady', { connector: this });
  }

  /**
   * Finds and returns the injected Solana wallet provider.
   * Assumes the provider is available on window.solana.
   */
  override findProvider(): ISolana | undefined {
    if (typeof window !== 'undefined' && (window as any).solana) {
      return (window as any).solana as ISolana;
    }
    return undefined;
  }

  /**
   * Connects to the wallet.
   * Uses the injected provider's connect method and stores the connected address.
   */
  override async connect(): Promise<void> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('Wallet provider not found');
    }
    if (provider.connect && typeof provider.connect === 'function') {
      await provider.connect();
    }
    const address = await this.getAddress();
    if (!address) {
      throw new DynamicError('No address returned after connecting');
    }
    this.activeAccount = address;
    logger.debug('[DefinitiveSolanaWalletConnector] Connected with address:', address);
  }

  /**
   * Returns the signer.
   * Often the injected provider itself is used for signing.
   */
  override async getSigner(): Promise<any> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('Wallet provider not found');
    }
    return provider;
  }

  /**
   * Retrieves the connected wallet address.
   */
  override async getAddress(): Promise<string | undefined> {
    const provider = this.findProvider();
    if (!provider || !provider.publicKey) return undefined;
    return (provider.publicKey as PublicKey).toString();
  }

  /**
   * Retrieves the connected accounts as an array.
   */
  override async getConnectedAccounts(): Promise<string[]> {
    const address = await this.getAddress();
    return address ? [address] : [];
  }

  /**
   * Signs a message.
   * Encodes the message as a Uint8Array and returns the signature as a hex string.
   */
  override async signMessage(message: string): Promise<string> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('Wallet provider not found');
    }
    if (typeof provider.signMessage !== 'function') {
      throw new DynamicError('Wallet provider does not support signMessage');
    }
    const encodedMessage = new TextEncoder().encode(message);
    
    // Await the signMessage result; assume it returns an object with a 'signature' property.
    const result = await provider.signMessage(encodedMessage);
    
    // Extract the actual signature (a Uint8Array) from the result.
    const signature: Uint8Array = result.signature;
    return Buffer.from(signature).toString('hex');
  }
  
}
