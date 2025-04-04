// // WalletConnectSolanaConnector.ts
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
  private textEncoder = new TextEncoder();

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

    return ReownSolanaSdkClient.getProvider();
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

  override async signMessage(messageToSign: string): Promise<string | undefined> {
    const signatureObj = ReownSolanaSdkClient.provider.signMessage(this.textEncoder.encode(messageToSign), messageToSign);
    const { signature: encodedSignature } = await signatureObj;
    return new TextDecoder("utf-8").decode(encodedSignature);
  }

  override filter(): boolean {
    return Boolean(this.findProvider());
  }
}

