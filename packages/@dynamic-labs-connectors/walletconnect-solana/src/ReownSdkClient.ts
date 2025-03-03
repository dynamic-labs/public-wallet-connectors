// ReownSdkClient.ts
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { WalletConnectWalletAdapter, type WalletConnectWalletAdapterConfig } from '@solana/wallet-adapter-walletconnect';
import type { ISolana } from '@dynamic-labs/solana-core';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export class ReownSdkClient {

  static isInitialized = false;
  static adapter: SolanaAdapter;
  static walletConnectSdk: WalletConnectWalletAdapter;
  static isConnected = false;

  // Private constructor: this class is a singleton.
  private constructor() {
    throw new Error('ReownSdkClient is not instantiable');
  }
  
  // Initialize the adapter/SDK and attempt to fetch wallet info
  static async init(): Promise<void> {
    if (ReownSdkClient.isInitialized) {
      return;
    }
    
    logger.debug('[ReownSdkClient] Initializing Solana adapter');

    // Pass the required configuration to WalletConnectWalletAdapter.
    const walletConnectConfig: WalletConnectWalletAdapterConfig = {
      network: WalletAdapterNetwork.Mainnet,
      // Put your projectId and other options inside the options property.
      options: {
      projectId: '650bf06b2ba268309996256ccf0ac529',
      },
    // Use a literal string that matches one of the allowed values.
    };

    // Instantiate your Solana adapter.
    ReownSdkClient.walletConnectSdk  = new WalletConnectWalletAdapter(walletConnectConfig);

    await ReownSdkClient.connect();
    ReownSdkClient.isInitialized = true;
  }

    // Returns the connected wallet's address (public key).
    static getAddress = () => {
        return ReownSdkClient.walletConnectSdk.publicKey;
    }

    // Returns the provider from the adapter. Adjust as needed if your adapter exposes a different property.
    static getProvider = () => {
        // Casting to ISolana because the walletConnect provider implements the solana interface
        // And that the expected type for the parent class SolanaInjectedContainer
        return ReownSdkClient.walletConnectSdk as unknown as ISolana;
    };


   // Sign a message using the connected wallet.
    static async signMessage(message: Uint8Array): Promise<Uint8Array> {
        return ReownSdkClient.walletConnectSdk.signMessage(message);
    }

    // The walletConnectSdk.connect() returns a private key. But I am only using it to verify connection because
    // the SolanaInjectedConnector.connect() function does not return any values. It was throwing errors when I
    // tried to pass the publicKey through.
    static async connect(): Promise<void> {
        if (!ReownSdkClient.walletConnectSdk) {
            throw new Error("WalletConnect adapter not initialized. Call init() first.");
        }

        await ReownSdkClient.walletConnectSdk.connect();

        const publicKey = ReownSdkClient.walletConnectSdk.publicKey;
            if (!publicKey) {
        throw new Error("Failed to connect wallet: publicKey is undefined");
        }

        ReownSdkClient.isConnected = ReownSdkClient.walletConnectSdk.connected;
    }
}
