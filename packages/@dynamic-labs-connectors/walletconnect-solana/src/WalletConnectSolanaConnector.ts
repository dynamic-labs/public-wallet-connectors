// // WalletConnectSolanaConnector.ts
// import { SolanaInjectedConnector } from '@dynamic-labs/solana';
// import { universalProviderClient } from './SolanaUniversalProvider';
// import { Transaction, VersionedTransaction } from '@solana/web3.js';
// import { ISolana, SolanaWalletConnectorOpts } from '@dynamic-labs/solana-core';
// import { logger } from '@dynamic-labs/wallet-connector-core';

// export class WalletConnectSolanaConnector extends SolanaInjectedConnector {
//   override name = 'WalletConnect Solana';
//   /**
//    * Initializes the Solana universal provider with optional configuration.
//    */

//   //   // To ensure WC works
//   override canConnectViaQrCode = true;
//   override isWalletConnect = true;
//   static initHasRun = false;
//   static providerFound = false;
//   override isAvailable = true;

//   constructor(props: SolanaWalletConnectorOpts) {
//     super({
//       ...props,
//       metadata: {
//         id: 'WalletConnect Solana',
//         name: 'WalletConnect Solana',
//         icon: 'https://reown.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fuvy10p5b%2Fproduction%2F01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png&w=256&q=100',
//       },
//     });
//   }

//   override async init(): Promise<void> {
//     console.log("[WalletConnectSolanaConnector] Initializing");
//     if (WalletConnectSolanaConnector.initHasRun == true) {
//       return;
//     }
//     try {
//       // await universalProviderClient.init();
//       WalletConnectSolanaConnector.initHasRun = true;
//       logger.debug('[WalletConnectSolanaConnector] onProviderReady');
//       this.walletConnectorEventsEmitter.emit('providerReady', {
//         connector: this,
//       });
//       console.log("[WalletConnectSolanaConnector] Initialization successful!");
//     } catch (error) {
//       console.error("[WalletConnectSolanaConnector] Failed to initialize:", error);
//       throw error;
//     }
//   } 

//   /**
//    * Connects to the wallet and returns the connected public key.
//    */
//   override async connect(): Promise<void> {
//     const result = await universalProviderClient.connect();
//     console.log("[WalletConnectSolanaConnector] Connection result:", result);
//   }

//   /**
//    * Disconnects the current wallet session.
//    */
//   public async disconnect(): Promise<void> {
//     await universalProviderClient.disconnect();
//   }

//   override async getConnectedAccounts(): Promise<string[]> {
//     if (universalProviderClient.connectedAccounts) {
//       console.log("Connected Accounts: ", universalProviderClient.connectedAccounts);
//       return Promise.resolve(universalProviderClient.connectedAccounts);
//     }
//     // Optionally handle the case where connectedAccounts is undefined
//     return Promise.resolve([]);
//   }

//   /**
//    * Signs a message using the connected wallet.
//    * @param message - The message to sign as a Uint8Array.
//    */
//   override async signMessage(messageToSign: string): Promise<string | undefined> {
//     const client = universalProviderClient;
//     if (!client || !client.isConnected) {
//       return undefined;
//     }
//     try {
//       // Convert the input message string to a Uint8Array.
//       const encoder = new TextEncoder();
//       const messageUint8 = encoder.encode(messageToSign);
  
//       // Sign the message using the provider.
//       const signedMessage = await client.signMessage(messageUint8); // type: SignedMessage
  
//       // Extract the signature (Uint8Array) and convert it to a base64 string.
//       return Buffer.from(signedMessage.signature).toString('base64');
//     } catch (error) {
//       return undefined;
//     }
//   }
  
  
//    override findProvider(): ISolana | undefined {
//     try {
//       // Attempt to retrieve the public key as a check that the provider is initialized.
//       if (WalletConnectSolanaConnector.providerFound) {
//         return;
//       }
//       universalProviderClient.init();
//       console.log("Connected Accounts: ", this.getConnectedAccounts());
//       console.log("Get Address: ", this.getAddress());
//       WalletConnectSolanaConnector.providerFound = true;
//       return universalProviderClient as ISolana;
//     } catch (error) {
//       // If the provider isn't fully initialized or connected, return undefined.
//       return undefined;
//     }
//   }

//   /**
//    * Signs a transaction using the connected wallet.
//    * @param transaction - The transaction (or versioned transaction) to sign.
//    */
//   public async signTransaction<T extends Transaction | VersionedTransaction>(
//     transaction: T
//   ): Promise<T> {
//     return await universalProviderClient.signTransaction(transaction);
//   }

//   /**
//    * Returns the current connected public key.
//    */
//   override async getAddress(): Promise<string | undefined> {
//     // return (await universalProviderClient.getPublicKey()).toString();
//     if (universalProviderClient.connectedAccounts) {
//       console.log("Connected Accounts: ", universalProviderClient.connectedAccounts);
//       return Promise.resolve(universalProviderClient.connectedAccounts[0]);
//     }
//     // Optionally handle the case where connectedAccounts is undefined
//     return Promise.resolve("");
//   }

//   /**
//    * Returns the connection URI if available.
//    */
//   public getConnectionUri(): string | undefined {
//     return universalProviderClient.getConnectionUri();
//   }

//   /**
//    * Checks whether the wallet is currently connected.
//    */
//   public isConnected(): boolean {
//     return universalProviderClient.isConnected;
//   }

// }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


import { SolanaInjectedConnector } from "@dynamic-labs/solana";
import {
  type SolanaWalletConnectorOpts,
  type ISolana,
} from "@dynamic-labs/solana-core";
import { ReownSolanaSdkClient } from "./ReownSolanaSdkClient.js";
import { Chain } from "@dynamic-labs/wallet-connector-core";

export class WalletConnectSolanaConnector extends SolanaInjectedConnector {
  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */

  override name = "WalletConnect Solana";

  override isWalletConnect = true;

  static projectId: string;

  override supportedChains: Chain[] = ["SOL"];

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(props: SolanaWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: "WalletConnect Solana",
        name: "WalletConnect Solana",
        icon: "https://cdn.sanity.io/images/uvy10p5b/production/01495a4964c8df30a7e8859c4f469e67dc9545a2-1024x1024.png",
      },
    });
  }

  /**
   * Initializes the Safe provider and emits the providerReady event
   * @override Required override from the base connector class
   */
  override async init(): Promise<void> {
    // This method can be called multiple times, but we should only
    // initialize the provider and emit the providerReady event once
    if (ReownSolanaSdkClient.isInitialized) {
      return;
    }

    if (
      WalletConnectSolanaConnector.projectId == null ||
      WalletConnectSolanaConnector.projectId === ""
    ) {
      throw new Error("WalletConnect projectId not found");
    }

    await ReownSolanaSdkClient.init(WalletConnectSolanaConnector.projectId);

    this.walletConnectorEventsEmitter.emit("providerReady", {
      connector: this,
    });
  }

  /**
   * Returns false because network switching doesn't work inside the safe app
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): ISolana | undefined {
    // This class isn't being `init`'d by the frammework, not sure how else to do this
    this.init();

    return ReownSolanaSdkClient.getProvider() as unknown as ISolana;
  }

  /**
   * Returns the address of the connected safe wallet
   */
  override async getAddress(): Promise<string | undefined> {
    await this.init();
    return ReownSolanaSdkClient.getAddress();
  }

  getSupportedNetworks(): string[] {
    return ["mainnet", "devnet"];
  }

  /**
   * @dev Nothing needs to be done here
   * @see Dynamic Contributing Guide
   */
  override async getConnectedAccounts(): Promise<string[]> {
    return await super.getConnectedAccounts();
  }

  override filter(): boolean {
    return Boolean(this.findProvider());
  }
}

