// ReownSdkClient.ts
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { WalletConnectWalletAdapter, type WalletConnectWalletAdapterConfig } from '@solana/wallet-adapter-walletconnect';
import { ISolana } from '@dynamic-labs/solana-core';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export enum WalletConnectChainID {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Deprecated_Mainnet = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
  Deprecated_Devnet = 'solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K',
}


export class ReownSdkClient {

  static isInitialized = false;
  private static adapter: SolanaAdapter;
  static walletConnectSdk: WalletConnectWalletAdapter;


  // Private constructor: this class is a singleton.
  private constructor() {
    throw new Error('ReownSdkClient is not instantiable');
  }
  
  // Initialize the adapter/SDK and attempt to fetch wallet info
  static async init(): Promise<void> {
    if (ReownSdkClient.isInitialized) {
      return;
    }

    ReownSdkClient.isInitialized = true;
    
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
      // Add any other required properties here

    // Instantiate your Solana adapter.
    ReownSdkClient.walletConnectSdk  = new WalletConnectWalletAdapter(walletConnectConfig);

    await ReownSdkClient.walletConnectSdk.connect();
    ReownSdkClient.isInitialized = true;
  }

    // Returns the connected wallet's address (public key).
    static getAddress = () => {
        return ReownSdkClient.walletConnectSdk.publicKey;
    }

    // Returns the provider from the adapter. Adjust as needed if your adapter exposes a different property.
    static getProvider = () => {
        // Casting to IEthereum because the Safe provider implements the eip-1193 interface
        // And that the expected type for the parent class EthereumInjectedConnector
        return ReownSdkClient.adapter as unknown as ISolana;
    };


   // Sign a message using the connected wallet.
    static async signMessage(message: Uint8Array): Promise<Uint8Array> {
        return ReownSdkClient.walletConnectSdk.signMessage(message);
    }

    static async connect() {
        ReownSdkClient.walletConnectSdk.connect();
    }
  //   // Convert the message to a Uint8Array (for example, using TextEncoder)
  //   const encoder = new TextEncoder();
  //   const messageBytes = encoder.encode(message);

  //   // Call the adapter’s signMessage method (adjust if the method signature differs)
  //   const signed: Uint8Array = await ReownSdkClient.adapter.signMessage(messageBytes);
  //   // Convert the signature to a hex string
  //   return Buffer.from(signed).toString('hex');
  // }

}
