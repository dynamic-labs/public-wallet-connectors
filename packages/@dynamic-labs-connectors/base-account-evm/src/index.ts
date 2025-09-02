import {
    type WalletConnectorsMethod,
  } from '@dynamic-labs/wallet-connector-core';
  import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { BaseAccountSDKOpts } from './types.js';
import { BaseAccountEvmWalletConnector } from './BaseAccountEvmWalletConnector.js';

export const createBaseAccountConnector = (
    baseAccountOpts: BaseAccountSDKOpts = {}
  ): WalletConnectorsMethod => {
    return () => [
      class extends BaseAccountEvmWalletConnector {
        constructor(props: EthereumWalletConnectorOpts) {
          super({
            ...props,
            ...baseAccountOpts,
          });
        }
      },
    ];
};
  
export type { BaseAccountSDKOpts } from './types.js';
  