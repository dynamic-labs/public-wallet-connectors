// ReownSdkClient.ts
import { SolanaAdapter, type AdapterOptions } from '@reown/appkit-adapter-solana';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { WalletConnectWalletAdapter, type WalletConnectWalletAdapterConfig } from '@solana/wallet-adapter-walletconnect';
import type { ISolana } from '@dynamic-labs/solana-core';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  Transaction,
  VersionedTransaction,
  SendOptions,
  TransactionSignature,
  PublicKey,
  Connection
} from '@solana/web3.js';


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


    ReownSdkClient.isInitialized = true;
  }

    // Returns the connected wallet's address (public key).
    static getAddress = () => {
        return ReownSdkClient.walletConnectSdk.publicKey;
    }

    // Returns the provider from the adapter. Adjust as needed if your adapter exposes a different property.
    // static getProvider = (): ISolana => {
    //     // Casting to ISolana because the walletConnect provider implements the solana interface
    //     // And that the expected type for the parent class SolanaInterface
    //     return ReownSdkClient.walletConnectSdk as unknown as ISolana;
    // };
    static getProvider = (): ISolana => {
      const adapter = ReownSdkClient.walletConnectSdk;
      if (!adapter) {
        throw new Error("WalletConnect adapter is not initialized");
      }
      // Return a new object that conforms to the ISolana interface.
      // const provider: ISolana = {       
      //   // Expose the underlying publicKey.
      //   publicKey: adapter.publicKey || undefined,
      //   isConnected: ReownSdkClient.isConnected,
  
      //   // Connect: delegate to adapter.connect and then return the publicKey as string.
      //   connect: async () => {
      //     await adapter.connect();
      //     if (!adapter.publicKey) {
      //       throw new Error("Wallet not connected");
      //     }
      //     return { publicKey: adapter.publicKey.toString() }; // returns an object matching ConnectionResult
      //   },
  
      //   // Disconnect: delegate to adapter.disconnect.
      //   disconnect: () => adapter.disconnect(),
  
      //   // signMessage: delegate to adapter.signMessage.
      //   signMessage: async (message: Uint8Array, encoding?: string) => {
      //     const result = await adapter.signMessage(message);
      //     return { signature: result };
      //   },
          
      //   // signTransaction: if supported by the adapter, delegate to it.
      //   signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      //     if (adapter.signTransaction) {
      //       return await adapter.signTransaction(tx);
      //     }
      //     throw new Error("signTransaction is not supported by the adapter");
      //   },
  
      //   // signAllTransactions: delegate if available.
      //   signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      //     if (adapter.signAllTransactions) {
      //       return await adapter.signAllTransactions(txs);
      //     }
      //     throw new Error("signAllTransactions is not supported by the adapter");
      //   },
  
      //   // signAndSendTransaction: delegate if available.
      //   // signAndSendTransaction: async <T extends Transaction | VersionedTransaction>(
      //   //   tx: T,
      //   //   options?: SendOptions
      //   // ): Promise<{ signature: TransactionSignature }> => {
      //   //   if (adapter.signAndSendTransaction) {
      //   //     return await adapter.signAndSendTransaction(tx, options);
      //   //   }
      //   //   throw new Error("signAndSendTransaction is not supported by the adapter");
      //   // },
  
      // };
  
      return SolanaAdapter as unknown as ISolana;
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
