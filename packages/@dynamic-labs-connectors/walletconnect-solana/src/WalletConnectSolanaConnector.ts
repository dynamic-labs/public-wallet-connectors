import { type SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
import { ISolana } from '@dynamic-labs/solana-core';
import { SolanaInjectedConnector } from '@dynamic-labs/solana';
import { DynamicError } from '@dynamic-labs/utils';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { ReownSdkClient } from './ReownSdkClient';


// This file mimics the structure of the Abstract EVM connector but for Solana.
// It assumes that a Solana wallet provider (like Phantom) is injected on window.solana.
export class WalletConnectSolanaConnector extends SolanaInjectedConnector {
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
  iconUrl = 'https://reown.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fuvy10p5b%2Fproduction%2F01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png&w=256&q=100';

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
        id: 'WalletConnectSolanaConnector',
        name: 'WalletConnectSolanaConnector Solana',
        icon: 'https://reown.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fuvy10p5b%2Fproduction%2F01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png&w=256&q=100',
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
    if (ReownSdkClient.isInitialized) {
      return;
    }
    if (this.solanaNetworks.length === 0) {
      return;
    }
    await ReownSdkClient.init()
    this.onProviderReady;
    WalletConnectSolanaConnector.initHasRun = true;
  }

  private onProviderReady = (): void => {
    logger.debug('[WalletConnectSolanaConnector] onProviderReady');

    // Emits the providerReady Event
    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    })

    // Tries to auto connect to the walletConnect
    this.tryAutoConnect();
  }

  private async tryAutoConnect(): Promise<void> {
    const walletConnectAddress = await this.getAddress;

    logger.debug(
      '[WalletConnectSolanaConnect] tryAutoConnect - address:',
      walletConnectAddress,
    );

    if (!walletConnectAddress) {
      logger.debug(
        '[WalletConnectSolanaConnect] tryAutoConnect - no address to connect',
        walletConnectAddress,
      );
    }

    // If there's an address, emit the autoConnect event
    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }


  /**
   * Finds and returns the injected Solana wallet provider.
   * Assumes the provider is available on window.solana.
   */
  override findProvider(): ISolana | undefined {
    return ReownSdkClient.getProvider();
  }

  /**
   * Connects to the wallet.
   * Uses the injected provider's connect method and stores the connected address.
   */
  override async connect(): Promise<void> {
    ReownSdkClient.connect();
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
    return ReownSdkClient.getAddress()?.toString();
  }

  /**
   * Signs a message.
   * Encodes the message as a Uint8Array and returns the signature as a hex string.
   */
  override async signMessage(message: string): Promise<string> {   
    const msg = new  TextEncoder().encode(message);
    const signature = ReownSdkClient.signMessage(msg);
    
    return (await signature).toString()
  }
  
}
