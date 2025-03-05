import type { ISolanaSigner, SignedMessage, ConnectionResult } from "@dynamic-labs/solana-core";
import type {Transaction, VersionedTransaction, TransactionSignature } from "@solana/web3.js";
import { WalletConnectWalletAdapter } from "@walletconnect/solana-adapter";
import { PublicKey } from "@solana/web3.js";
import EventEmitter from 'eventemitter3';

interface ISolanaEvents {
    connect(...args: unknown[]): unknown;
    disconnect(...args: unknown[]): unknown;
    accountChanged(publicKey: string): unknown;
    activeWalletDidChange(publicKey: string): unknown;
}


export class ReownProvider extends EventEmitter<ISolanaEvents> implements ISolanaSigner {
  isBraveWallet = false;
  isGlow = false;
  isPhantom = false;
  isSolflare = false;
  isExodus = false;
  isBackpack = false;
  isMagicEden = false;

  publicKey?: PublicKey | undefined;
  isConnected = false;
  providers: ISolanaSigner[] = [];

  private sdk: WalletConnectWalletAdapter;

  constructor(sdk: WalletConnectWalletAdapter) {
    super();
    this.sdk = sdk;
  }

  // Override signTransaction by delegating to the underlying SDK.
  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (this.sdk.signTransaction) {
      return await this.sdk.signTransaction(transaction);
    }
    throw new Error("signTransaction is not supported by the adapter");
  }

    // Override signAllTransactions similarly.
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    if (this.sdk.signAllTransactions) {
      return await this.sdk.signAllTransactions(transactions);
    }
    throw new Error("signAllTransactions is not supported by the adapter");
    }

    async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
      transaction: T,
      //options?: SendOptions
    ): Promise<{ signature: TransactionSignature }> {
      if (this.sdk.signTransaction) {
        const signedTx = await this.sdk.signTransaction(transaction);
        const sig = signedTx.signatures;
        if (!sig) {
          throw new Error("Transaction did not receive a signature");
        }
        // If the signature is a Buffer, convert it to a string (using hex encoding, for example)
        const signatureStr = Buffer.isBuffer(sig) ? sig.toString('hex') : String(sig);
        return { signature: signatureStr as TransactionSignature };
      }
      throw new Error("signAndSendTransaction is not supported by the adapter");
    }
    

   // Override signMessage.
   async signMessage(
    message: Uint8Array,
    //encoding?: string
  ): Promise<SignedMessage> {
    const result = await this.sdk.signMessage(message);
    return { signature: result };
  }

  connect = async (
    //args?: { onlyIfTrusted: boolean }
  ): Promise<ConnectionResult> => {
    // Implement your connection logic here.
    await this.sdk.connect();
    this.isConnected = this.sdk.connected;
    
    // Convert from type: PublicKey | Null to type: PublicKey | Undefined
    this.publicKey = this.wrapPublicKey(this.sdk.publicKey);
    
    if (this.publicKey == undefined) {
      throw new Error("Connection Error");
    }

    return { publicKey: this.publicKey.toBytes() };
  };

  // Convert from type: PublicKey | Null to type: PublicKey | Undefined
  wrapPublicKey(key: PublicKey | null): PublicKey | undefined {
    return key === null ? undefined : key;
  }
  
  
  async disconnect(): Promise<void> {
    // Implement your disconnection logic here.
    this.sdk.disconnect();
    this.isConnected = this.sdk.connected;
    this.publicKey = undefined;
  }

  
  // override listeners<T extends keyof ISolanaEvents & (string | symbol)>(
  //   event: T
  // ): ((...args: EventEmitter.ArgumentMap<ISolanaEvents>[T]) => void)[] {
  //   return super.listeners(event) as ((...args: EventEmitter.ArgumentMap<ISolanaEvents>[T]) => void)[];
  // }
  
  // // Override eventNames to satisfy the type requirement.
  // override eventNames(): (keyof ISolanaEvents)[] {
  //   // For example, assume our ISolanaEvents only includes "connect" and "disconnect".
  //   const allowed: (keyof ISolanaEvents)[] = ['connect', 'disconnect'];
  //   return super.eventNames().filter((name): name is keyof ISolanaEvents => {
  //     return typeof name === "string" && allowed.includes(name as keyof ISolanaEvents);
  //   });
  // }
}
