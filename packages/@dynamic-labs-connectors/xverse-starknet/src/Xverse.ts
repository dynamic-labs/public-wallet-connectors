import { connect } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { type WalletConnectorOpts } from '@dynamic-labs/wallet-connector-core';

import { XverseBase } from './base/XverseBase.js';

type PromptResult = {
  data?: {
    account?: string;
    chainId?: bigint;
  };
  wallet?: any;
};

export class Xverse extends XverseBase {
  override overrideKey = 'xverse';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(opts: WalletConnectorOpts<any>) {
    super('Xverse Wallet', 'xverse', 'xverse', opts);
  }

  override async prompt(): Promise<PromptResult> {
    const { connectorData, wallet } = await connect({
      connectors: [new InjectedConnector({ options: { id: this.id } })],
      modalMode: 'canAsk',
    });

    return {
      data: {
        account: connectorData?.account,
        chainId: connectorData?.chainId,
      },
      wallet: wallet ?? undefined,
    };
  }
}

export type XverseWalletConnectorType = Xverse;
