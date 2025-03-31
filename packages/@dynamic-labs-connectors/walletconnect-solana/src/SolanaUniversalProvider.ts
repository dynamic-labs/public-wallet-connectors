import UniversalProvider from '@walletconnect/universal-provider';
import { PublicKey, SendOptions, Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { logger } from '@dynamic-labs/wallet-connector-core';
import type { ISolanaSigner, SignedMessage, ConnectionResult  } from "@dynamic-labs/solana-core";
import EventEmitter from 'eventemitter3';

interface ISolanaEvents {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(publicKey: string): unknown;
  activeWalletDidChange(publicKey: string): unknown;
}

export class UniversalProviderClient extends EventEmitter<ISolanaEvents> implements ISolanaSigner  {
  private static instance: UniversalProviderClient;
  private _provider: UniversalProvider | undefined;
  // private _publicKey: PublicKey | undefined;
  private _isConnected = false;
  private _connectionUri: string | undefined;
  public readonly isBraveWallet: boolean = true;
  public readonly isGlow: boolean = true;
  public readonly isPhantom: boolean = true;
  public readonly isSolflare: boolean = true;
  public readonly isExodus: boolean = true;
  public readonly isBackpack: boolean = true;
  public readonly isMagicEden: boolean = true;

  private constructor() { 
    super();
  }
  
  publicKey?: { toBytes(): Uint8Array; } | undefined;
  providers: ISolanaSigner[] = [];;

  public static getInstance(): UniversalProviderClient {
    if (!UniversalProviderClient.instance) {
      UniversalProviderClient.instance = new UniversalProviderClient();
    }
    return UniversalProviderClient.instance;
  }

  // public async init(options?: {
  //   projectId?: string;
  //   relayUrl?: string;
  //   metadata?: any;
  // }): Promise<void> {
    public async init(): Promise<void> {
    // const projectId = options?.projectId || '650bf06b2ba268309996256ccf0ac529';
    
    try {
      // this._provider = await UniversalProvider.init({
      //   projectId,
      //   relayUrl: options?.relayUrl,
      //   metadata: options?.metadata || {
      //     name: "Reown",
      //     description: "Reown Wallet Connection",
      //     icons: ["https://reown.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fuvy10p5b%2Fproduction%2F01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png&w=256&q=100"] // Replace with your app's icon
      //   }
      // });
      this._provider = await UniversalProvider.init({
        projectId: '650bf06b2ba268309996256ccf0ac529'
      });

      this.connect();

      // Add event listeners
      // this._provider.on('display_uri', (uri: string) => {
      //   this._connectionUri = uri;
      //   console.log('Wallet Connection URI:', uri);
      //   // You might want to trigger a UI update or callback here
      // });

      // this._provider.on('connect', () => {
      //   this._isConnected = true;
      //   this._updatePublicKey();
      // });

      // this._provider.on('disconnect', () => {
      //   this._isConnected = false;
      //   this._publicKey = undefined;
      //   this._connectionUri = undefined;
      // });

    } catch (error) {
      logger.error('[Universal Provider] Initialization failed', error);
      throw error;
    }
  }

  public async connect(): Promise<ConnectionResult> {
    if (!this._provider) {
      throw new Error('Provider not initialized. Call init() first.');
    }

    const proposalNamespace = {
      requiredNamespaces: {
        solana: {
          methods: ["solana_signTransaction", "solana_signMessage"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    };
  
    try {
      const { uri, approval } = await this._provider.client.connect(proposalNamespace);
      this._connectionUri = uri;
      console.log("Connection URI:", uri);
      // You can now use this URI to generate a QR code or for deep linking
  
      // Handle the approval to complete the connection
      const session = await approval();
      console.log("Connected session:", session);
      return { publicKey: (await this.getPublicKey()).toBytes() };
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  public async signMessage(message: Uint8Array): Promise<SignedMessage> {
    if (!this._provider || !this._isConnected) {
      throw new Error('Provider not connected');
    }
  
    try {
      const signedMessageResult = await this._provider.request({
        method: 'solana_signMessage',
        params: [
          Buffer.from(message).toString('base64'),
          'base64'
        ]
      });
  
      // Safely handle the response
      if (typeof signedMessageResult === 'string') {
        // Convert the returned base64 string back into a Uint8Array.
        return { signature: Buffer.from(signedMessageResult, 'base64') };
      } else {
        throw new Error('Invalid signed message response');
      }
    } catch (error) {
      logger.error('[Universal Provider] Message signing failed', error);
      throw error;
    }
  }
  
  public async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (!this._provider || !this._isConnected) {
      throw new Error('Provider not connected');
    }

    try {
      const signedTransactionResult = await this._provider.request({
        method: 'solana_signTransaction',
        params: [transaction.serialize().toString('base64')]
      });
        // Safely handle the response
      if (typeof signedTransactionResult === 'string') {
        return VersionedTransaction.deserialize(
          Buffer.from(signedTransactionResult, 'base64')
        ) as T;
      } else {
        throw new Error('Invalid signed transaction response');
      }
    } catch (error) {
      logger.error('[Universal Provider] Transaction signing failed', error);
      throw error;
    }
  }

  public async getPublicKey(): Promise<PublicKey> {
    if (!this._provider) {
      throw new Error('Provider not initialized. Call init() first.');
    }
  
    const proposalNamespace = {
      requiredNamespaces: {
        solana: {
          methods: ["solana_signTransaction", "solana_signMessage"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    };
  
    try {
      this._provider = await UniversalProvider.init({
        projectId: '650bf06b2ba268309996256ccf0ac529'
      });

      const { approval } = await this._provider.client.connect(proposalNamespace);
      const session = await approval();
  
      // Check if namespaces and the solana namespace exist in the session
      if (!session.namespaces || !session.namespaces['solana']) {
        throw new Error("Solana namespace is missing in session.");
      }
      
      const solanaNamespace = session.namespaces['solana'];
  
      // Ensure that there is at least one account available
      if (!solanaNamespace.accounts || solanaNamespace.accounts.length === 0) {
        throw new Error("No accounts found in the Solana namespace.");
      }
  
      // Retrieve the public key string and convert it to a PublicKey object.
      const publicKeyStr = solanaNamespace.accounts[0];
      console.log("Solana Public Key:", publicKeyStr);
      if (publicKeyStr != null) {
        return new PublicKey(publicKeyStr);
      }
      throw new Error("Can't find public key");
    } catch (error) {
      console.error("Error getting public key:", error);
      throw error;
    }
  }
  

  public getConnectionUri(): string | undefined {
    return this._connectionUri;
  }

  public get isConnected(): boolean {
    return this._isConnected;
  }

   // Implement signAllTransactions by mapping over each transaction
   public async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    if (!this._provider || !this._isConnected) {
      throw new Error('Provider not connected');
    }
    const signedTransactions = await Promise.all(transactions.map(tx => this.signTransaction(tx)));
    return signedTransactions;
  }

  // Implement signAndSendTransaction by signing then sending the transaction
  public async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature; }> {
    if (!this._provider || !this._isConnected) {
      throw new Error('Provider not connected');
    }
    // First sign the transaction
    const signedTx = await this.signTransaction(transaction);
    // Serialize the signed transaction to base64
    const txBase64 = signedTx.serialize().toString('base64');
    // Request the provider to send the transaction. Adjust the method name if needed.
    const result = await this._provider.request({
      method: 'solana_sendTransaction',
      params: [txBase64, options]
    });
    if (typeof result !== 'string') {
      throw new Error('Invalid transaction signature response');
    }
    return { signature: result };
  }

  public async disconnect(): Promise<void> {
  if (!this._provider) {
    throw new Error('Provider not initialized. Call init() first.');
  }
  await this._provider.client.disconnect;
}


}

// Singleton export for ease of use
export const universalProviderClient = UniversalProviderClient.getInstance();