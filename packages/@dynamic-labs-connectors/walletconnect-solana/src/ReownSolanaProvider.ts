import {
    SignedMessage,
    ConnectionResult,
    ISolanaSigner,
    ISolanaEvents,
  } from "@dynamic-labs/solana-core";
  import {
    Connection,
    PublicKey,
    SendOptions,
    Transaction,
    VersionedTransaction,
  } from "@solana/web3.js";
  import {
    WalletConnectWalletAdapter,
    WalletConnectWalletAdapterConfig,
  } from "@walletconnect/solana-adapter";
  import EventEmitter from "eventemitter3";
  
  export class ReownSolanaProvider
    extends EventEmitter<ISolanaEvents>
    implements ISolanaSigner
  {
    // ReownSolanaProvider Implementation
    protected sdk!: WalletConnectWalletAdapter;
  
    // ISolanaSigner
    isBackpack = false;
    isPhantom = false;
    isBraveWallet = false;
    isGlow = false;
    isSolflare = false;
    isExodus = false;
    isMagicEden = false;
    isConnected: boolean = false;
    publicKey: ISolanaSigner["publicKey"];
    providers: ISolanaSigner["providers"] = [];
  
    signTransaction: ISolanaSigner["signTransaction"];
    signAllTransactions: ISolanaSigner["signAllTransactions"];
    disconnect: ISolanaSigner["disconnect"];
  
    constructor(config: WalletConnectWalletAdapterConfig) {
      super();
  
      this.sdk = new WalletConnectWalletAdapter(config);
      this.initSdkEvents();
  
      this.publicKey = this.sdk.publicKey ?? undefined;
      this.isConnected = this.sdk.connected ?? false;
      this.signTransaction = this.sdk.signTransaction.bind(this);
      this.signAllTransactions = this.sdk.signAllTransactions.bind(this);
      this.disconnect = this.sdk.disconnect.bind(this);
  
      this.providers = [this];
    }
  
    private initSdkEvents() {
      this.sdk.on("connect", this.handleOnConnect.bind(this));
      this.sdk.off("readyStateChange");
    }
  
    private handleOnConnect = (publicKey: PublicKey) => {
      this.publicKey = publicKey;
      this.emit("accountChanged", publicKey.toString());
      this.emit("activeWalletDidChange", publicKey.toString());
    };
  
    async connect(
      _args?: { onlyIfTrusted: boolean } | undefined,
    ): Promise<ConnectionResult> {
      if (this.sdk == null) {
        throw new Error("WalletConnect Sdk is not initialized");
      }
  
      await this.sdk.connect();
  
      return {
        address: this.sdk.publicKey?.toString(),
        publicKey: this.sdk.publicKey ?? undefined,
      };
    }
  
    async signMessage(
      message: Uint8Array,
    ): Promise<SignedMessage> {
      if (this.sdk == null) {
        throw new Error("WalletConnect Sdk is not initialized");
      }
      return { signature: await this.sdk.signMessage(message) };
    }
  
    async signAndSendTransaction<T extends Transaction | VersionedTransaction>(
      transaction: T,
      options?: SendOptions,
    ) {
      if (this.sdk == null) {
        throw new Error("WalletConnect Sdk is not initialized");
      }
  
      const signedTX = await this.sdk.signTransaction(transaction);
    
      await this.sdk.sendTransaction(
        signedTX,
        new Connection(this.sdk.url),
        options,
      );
  
      return { signature: signedTX!.serialize().toString("base64") };
    }
  }
  