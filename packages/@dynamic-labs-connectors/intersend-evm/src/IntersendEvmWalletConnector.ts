import { type Hex } from 'viem';
import { logger } from '@dynamic-labs/wallet-connector-core';
import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { IntersendSdkClient } from './IntersendSdkClient.js';

export class IntersendEvmWalletConnector extends EthereumInjectedConnector {
  override name = 'Intersend';

  // Define supported networks
  private readonly SUPPORTED_CHAIN_IDS = [
    1,      // Ethereum Mainnet
    137,    // Polygon
    42161,  // Arbitrum
    10,     // Optimism
    8453,   // Base
    59144,  // Linea
    43114,  // Avalanche
  ];

  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'intersend',
        name: 'Intersend',
        icon: 'https://storage.googleapis.com/external-assets-intersend/Emblem.png',
      },
    });

    // Filter EVMNetworks to only include supported networks
    this.evmNetworks = this.evmNetworks.filter((network) =>
      this.SUPPORTED_CHAIN_IDS.includes(network.chainId)
    );
  }

  override async init(): Promise<void> {
    if (IntersendSdkClient.isInitialized) {
      return;
    }

    await IntersendSdkClient.init();
    this.onProviderReady();
  }

  private onProviderReady = (): void => {
    logger.debug('[IntersendEvmWalletConnector] onProviderReady');

    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });

    this.tryAutoConnect();
  };

  private async tryAutoConnect(): Promise<void> {
    const address = await this.getAddress();

    logger.debug(
      '[IntersendEvmWalletConnector] tryAutoConnect - address:',
      address,
    );

    if (!address) {
      logger.debug(
        '[IntersendEvmWalletConnector] tryAutoConnect - no address to connect',
      );
      return;
    }

    this.walletConnectorEventsEmitter.emit('autoConnect', {
      connector: this,
    });
  }

  override supportsNetworkSwitching(): boolean {
    return true;
  }

  override async switchNetwork(chainId: number): Promise<void> {
    try {
      if (!this.SUPPORTED_CHAIN_IDS.includes(chainId)) {
        throw new Error(`Chain ID ${chainId} is not supported`);
      }

      const provider = this.findProvider();
      if (!provider) {
        throw new Error('Provider not found');
      }

      const network = this.evmNetworks.find((n) => n.chainId === chainId);
      if (!network) {
        throw new Error(`Network configuration not found for chain ID ${chainId}`);
      }

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      }).catch(async (error) => {
        // If the chain hasn't been added to the user's wallet
        if (error.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: [network.blockExplorerUrl],
            }],
          });
        } else {
          throw error;
        }
      });

      // Emit network changed event
      this.walletConnectorEventsEmitter.emit('networkChanged', {
        chainId,
        connector: this,
      });
    } catch (error) {
      logger.error('[IntersendEvmWalletConnector] switchNetwork error:', error);
      throw error;
    }
  }

  override findProvider(): IEthereum | undefined {
    return IntersendSdkClient.getProvider();
  }

  override async getAddress(): Promise<string | undefined> {
    return IntersendSdkClient.getAddress();
  }

  override async getConnectedAccounts(): Promise<string[]> {
    const connectedAccount = await this.getAddress();

    if (!connectedAccount) {
      return [];
    }

    this.setActiveAccount(connectedAccount as Hex);

    return [connectedAccount];
  }

  override async signMessage(messageToSign: string): Promise<string | undefined> {
    const client = this.getWalletClient();

    if (!client) {
      return undefined;
    }

    return client.signMessage({
      message: messageToSign,
    });
  }

  override filter(): boolean {
    return Boolean(IntersendSdkClient.getProvider());
  }

  // Add method to get current chain ID
  async getChainId(): Promise<number | undefined> {
    try {
      const provider = this.findProvider();
      if (!provider) {
        return undefined;
      }

      const chainId = await provider.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      logger.error('[IntersendEvmWalletConnector] getChainId error:', error);
      return undefined;
    }
  }
}