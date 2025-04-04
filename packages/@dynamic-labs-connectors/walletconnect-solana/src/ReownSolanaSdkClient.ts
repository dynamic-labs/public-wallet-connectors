import { logger } from "@dynamic-labs/wallet-connector-core";
import { type ISolana } from "@dynamic-labs/solana-core";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletConnectWalletAdapterConfig } from "@walletconnect/solana-adapter";
import { ReownSolanaProvider } from "./ReownSolanaProvider.js";

export class ReownSolanaSdkClient {
  static isInitialized = false;
  static provider: ReownSolanaProvider;

  private constructor() {
    throw new Error("ReownSolanaSdkClient is not instantiable");
  }

  static init = async (projectId: string) => {
    if (ReownSolanaSdkClient.isInitialized) {
      return;
    }

    const config: WalletConnectWalletAdapterConfig = {
      network: WalletAdapterNetwork.Mainnet,
      options: {
        projectId,
        relayUrl: "wss://relay.walletconnect.com",
      },
    };

    logger.debug("[ReownSolanaSdkClient] initializing provider");

    ReownSolanaSdkClient.provider = new ReownSolanaProvider(config);

    logger.debug("[ReownSolanaSdkClient] provider initialized");
    ReownSolanaSdkClient.isInitialized = true;
  };

  static getAddress(): string | undefined {
    return ReownSolanaSdkClient.provider.publicKey?.toString() ?? undefined;
  }

  static getProvider = (): ISolana => {
    return ReownSolanaSdkClient.provider;
  };
}
