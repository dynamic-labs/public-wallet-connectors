// WalletConnectSolanaConnector.ts
import { SolanaInjectedConnector } from '@dynamic-labs/solana';
import { universalProviderClient } from './SolanaUniversalProvider';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { ISolana, SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
import { logger } from '@dynamic-labs/wallet-connector-core';

export class WalletConnectSolanaConnector extends SolanaInjectedConnector {
  override name = 'WalletConnect Solana';
  /**
   * Initializes the Solana universal provider with optional configuration.
   */

  //   // To ensure WC works
  override canConnectViaQrCode = true;
  override isWalletConnect = true;
  static initHasRun = false;
  override isAvailable = true;

  constructor(props: SolanaWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'WalletConnect Solana',
        name: 'WalletConnect Solana',
        icon: 'https://reown.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fuvy10p5b%2Fproduction%2F01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png&w=256&q=100',
      },
    });
  }

  override async init(): Promise<void> {
    console.log("[WalletConnectSolanaConnector] Initializing");
    if (WalletConnectSolanaConnector.initHasRun == true) {
      return;
    }
    try {
      await universalProviderClient.init();
      WalletConnectSolanaConnector.initHasRun = true;
      logger.debug('[WalletConnectSolanaConnector] onProviderReady');
      this.walletConnectorEventsEmitter.emit('providerReady', {
        connector: this,
      });
      console.log("[WalletConnectSolanaConnector] Initialization successful!");
    } catch (error) {
      console.error("[WalletConnectSolanaConnector] Failed to initialize:", error);
      throw error;
    }
  } 

  /**
   * Connects to the wallet and returns the connected public key.
   */
  override async connect(): Promise<void> {
    console.log("[WalletConnectSolanaConnector] universalProviderClient state:", universalProviderClient);
    const result = await universalProviderClient.connect();
    console.log("[WalletConnectSolanaConnector] Connection result:", result);
    // console.log("[WalletConnectSolanaConnector] Connection state after connect:", universalProviderClient.isConnected);

    // logger.debug('[WalletConnectSolanaConnector] onProviderReady');

    // this.walletConnectorEventsEmitter.emit('providerReady', { 
    //   connector: this,
    // });
    console.log("WalletConnectSolanaConnector: providerReady event emitted");
  }

  /**
   * Disconnects the current wallet session.
   */
  public async disconnect(): Promise<void> {
    await universalProviderClient.disconnect();
  }

  /**
   * Signs a message using the connected wallet.
   * @param message - The message to sign as a Uint8Array.
   */
  override async signMessage(messageToSign: string): Promise<string | undefined> {
    const client = universalProviderClient;
    if (!client || !client.isConnected) {
      return undefined;
    }
    try {
      // Convert the input message string to a Uint8Array.
      const encoder = new TextEncoder();
      const messageUint8 = encoder.encode(messageToSign);
  
      // Sign the message using the provider.
      const signedMessage = await client.signMessage(messageUint8); // type: SignedMessage
  
      // Extract the signature (Uint8Array) and convert it to a base64 string.
      return Buffer.from(signedMessage.signature).toString('base64');
    } catch (error) {
      return undefined;
    }
  }
  
  
   override findProvider(): ISolana | undefined {
    try {
      // Attempt to retrieve the public key as a check that the provider is initialized.
      universalProviderClient.init();
      return universalProviderClient as ISolana;
    } catch (error) {
      // If the provider isn't fully initialized or connected, return undefined.
      return undefined;
    }
  }
  

  /**
   * Signs a transaction using the connected wallet.
   * @param transaction - The transaction (or versioned transaction) to sign.
   */
  public async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    return await universalProviderClient.signTransaction(transaction);
  }

  /**
   * Returns the current connected public key.
   */
  public async getPublicKey(): Promise<PublicKey> {
    return await universalProviderClient.getPublicKey();
  }

  /**
   * Returns the connection URI if available.
   */
  public getConnectionUri(): string | undefined {
    return universalProviderClient.getConnectionUri();
  }

  /**
   * Checks whether the wallet is currently connected.
   */
  public isConnected(): boolean {
    return universalProviderClient.isConnected;
  }

}
