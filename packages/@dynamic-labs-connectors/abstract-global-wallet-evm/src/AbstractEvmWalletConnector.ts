import { EthereumWalletConnector, type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { type IEthereum } from '@dynamic-labs/ethereum';
import { toPrivyWalletProvider } from '@privy-io/cross-app-connect'
import { transformEIP1193Provider } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import { DynamicError } from '@dynamic-labs/utils';
import { type Chain, logger } from '@dynamic-labs/wallet-connector-core';
import { type Account, type Transport,createWalletClient, custom, type WalletClient, type Chain as ViemChain } from 'viem';
import { findWalletBookWallet, getWalletBookWallet } from '@dynamic-labs/wallet-book';

const AGW_APP_ID = 'cm04asygd041fmry9zmcyn5o5';

export class AbstractEvmWalletConnector extends EthereumWalletConnector {

  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override name = 'Abstract';

  wallet: ReturnType<typeof getWalletBookWallet> | undefined;
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
        icon: 'https://d9s2izusg5pvp.cloudfront.net/icon/light.png',
      },
    });

    this.isInitialized = false;
    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }
  /**
   * Returns false because we only support Abstract
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override canConnectViaCustodialService = true;

  override async init(): Promise<void> {
    // here you should initialize the connector client/sdk

    // this function can be called multiple times, so you must have a flag that indicates if the connector is already initialized
    // (can't be an instance variable, because it will be reset every time the connector is instantiated)
    // once the provider is initialized, you should emit the providerReady event once, and only once
    if (this.isInitialized) {
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

  override getWalletClient():  WalletClient<Transport, ViemChain, Account> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('No provider found');
    }

    const walletClient = createWalletClient({
      transport: custom(provider),
      chain: abstractTestnet,
    })
    return walletClient as unknown as WalletClient<Transport, ViemChain, Account>;
  }

  findProvider(): IEthereum | undefined {
    let chain = this.getActiveChain();
    if (!chain) {
      chain = abstractTestnet; // TODO: add mainnet
    } 
    
    const privyProvider = toPrivyWalletProvider({
      providerAppId: AGW_APP_ID,
      chains: [abstractTestnet] // TODO: add mainnet
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
    return await provider.request({ method: 'personal_sign', params: [message, this.getAddress()] }) as unknown as string;
  }

  override async getNetwork(): Promise<number | undefined> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError('No provider found');
    }
    const chainId = await provider.request({ method: 'eth_chainId' }) as unknown as number;
    return chainId;
  }
}
