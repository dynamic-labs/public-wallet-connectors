import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { toPrivyWalletProvider } from '@privy-io/cross-app-connect'
import { transformEIP1193Provider } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import { DynamicError } from '@dynamic-labs/utils';
import { type Chain, logger } from '@dynamic-labs/wallet-connector-core';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';
import { toHex, type Chain as ViemChain } from 'viem';
const AGW_APP_ID = 'cm04asygd041fmry9zmcyn5o5';

export class AbstractEvmWalletConnector extends EthereumInjectedConnector {

  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override name = 'Abstract';

  abstractNetworks: ViemChain[];

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'abstract',
        name: 'Abstract',
        icon: 'https://abstract-assets.abs.xyz/icons/light.png',
      },
    });

    this.abstractNetworks = [];
    for (const network of props.evmNetworks) {
      if (network.chainId === abstractTestnet.id) {
        this.abstractNetworks.push(abstractTestnet);
      }
      // TODO: add mainnet once viem definition is added
      // if (network.chainId === abstract.id) {
      //   this.abstractNetworks.push(abstract);
      // }
    }
    this.isInitialized = false;
    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }
  /**
   * Returns false because we only support Abstract
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override isInstalledOnBrowser(): boolean {
    return true;
  }

  override async init(): Promise<void> {
    // this function can be called multiple times, so you must have a flag that indicates if the connector is already initialized
    // (can't be an instance variable, because it will be reset every time the connector is instantiated)
    // once the provider is initialized, you should emit the providerReady event once, and only once
    if (this.isInitialized) {
      return;
    }
    // if there are no abstract networks configured, we can't initialize the connector
    if (this.abstractNetworks.length === 0) {
      return;
    }
    this.isInitialized = true;

    logger.debug('[AbstractEvmWalletConnector] onProviderReady');
    this.walletConnectorEventsEmitter.emit('providerReady', {
      connector: this,
    });
  }

  override supportedChains: Chain[] = ["EVM", "ETH"];

  override connectedChain: Chain = "EVM";

  override findProvider(): IEthereum | undefined {
    let chain = this.getActiveChain();
    if (!chain) {
      if (this.abstractNetworks.length === 1) {
        // use the only configured abstract network from the connector options
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        chain = this.abstractNetworks[0]!;
      } else {
        // chain = abstract; // TODO: default to the abstract mainnet once viem definition is added
        chain = abstractTestnet;
      }
    }

    const privyProvider = toPrivyWalletProvider({
      providerAppId: AGW_APP_ID,
      chains: [chain]
    });

    const provider = transformEIP1193Provider({
      provider: privyProvider,
      isPrivyCrossApp: true,
      chain
    });
    // Casting to IEthereum because the provider implements the eip-1193 interface
    // and that the expected type for the parent class EthereumInjectedConnector
    return provider as unknown as IEthereum;
  }

  override async getAddress(): Promise<string | undefined> {
    const accounts = await this.findProvider()?.request({ method: 'eth_requestAccounts' });
    return accounts?.[0] as string | undefined;
  }

  override async getConnectedAccounts(): Promise<string[]> {
    return await this.findProvider()?.request({ method: 'eth_requestAccounts' }) ?? [];
  }

  override async signMessage(message: string): Promise<string> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('No provider found');
    }
    const address = await this.getAddress();
    return await provider.request({ method: 'personal_sign', params: [toHex(message), address] }) as unknown as string;
  }
}
