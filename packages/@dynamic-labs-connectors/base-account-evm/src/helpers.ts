'use client';

import { createBaseAccountSDK, type ProviderInterface } from '@base-org/account';
import { type BaseAccountEvmWalletConnectorOpts } from './BaseAccountEvmWalletConnector.js';


let baseAccountProvider: ProviderInterface | undefined;

const baseSepolia = 84532;
const baseMainnet = 8453;

export const getBaseAccountProvider = (opts: BaseAccountEvmWalletConnectorOpts) => {
 const { evmNetworks } = opts;
  const appChainIds = evmNetworks?.map((network) => Number(network.chainId));

  // just brings base sepolia to the front of the list, because that is treated as the default chain
  const hasBaseSepolia = evmNetworks?.some((network) => Number(network.chainId) === baseSepolia);
  if (hasBaseSepolia) {
    appChainIds?.sort((a, b) =>
      a === baseSepolia ? -1 : b === baseSepolia ? 1 : 0
    );
  }

  // just brings base mainnet to the front, because that that is treated as the default chain
  const hasBaseMainnet = evmNetworks?.some((network) => Number(network.chainId) === baseMainnet);
  if (hasBaseMainnet) {
    appChainIds?.sort((a, b) =>
      a === baseMainnet ? -1 : b === baseMainnet ? 1 : 0
    );
  }

  if (!baseAccountProvider) {
    const baseAccountSdk = createBaseAccountSDK({
      ...opts,
      appChainIds,
    });

    baseAccountProvider = baseAccountSdk.getProvider();
  }

  return baseAccountProvider;
};