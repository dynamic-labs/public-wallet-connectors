import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';
import { toPrivyWalletProvider} from '@privy-io/cross-app-connect'
import { transformEIP1193Provider } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';

const AGW_APP_ID = 'cm04asygd041fmry9zmcyn5o5';

export class AbstractEvmWalletConnector extends EthereumInjectedConnector {

  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override name = 'Abstract';

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(props: EthereumWalletConnectorOpts) {
    super({
      ...props,
      metadata: {
        id: 'abstract-global-wallet',
        name: 'Abstract',
        icon: 'https://d9s2izusg5pvp.cloudfront.net/icon/light.png',
      },
    });

    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }
  /**
   * Returns false because we only support Abstract
   */
  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override findProvider(): IEthereum | undefined {
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
}