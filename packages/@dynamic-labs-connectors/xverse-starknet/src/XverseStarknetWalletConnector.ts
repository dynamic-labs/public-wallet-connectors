import { connect, disconnect, type StarknetWindowObject } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { StarknetWalletConnector } from '@dynamic-labs/starknet';

type PromptOptions = {
  silently: boolean;
};

type PromptResult = {
  data: {
    account: string | undefined;
    chainId: bigint | undefined;
  } | undefined;
  wallet: StarknetWindowObject | undefined;
};

export class XverseStarknetWalletConnector extends StarknetWalletConnector {
  override overrideKey = 'xversestarknet';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(opts: any) {
    super('Xverse', 'xverse', 'xversestarknet', opts);
  }

  override async prompt(options: PromptOptions): Promise<PromptResult> {
    const { connectorData, wallet } = await connect({
      connectors: [new InjectedConnector({ options: { id: this.id } })],
      modalMode: options.silently ? 'neverAsk' : 'canAsk',
    });

    return {
      data: connectorData ? {
        account: connectorData.account,
        chainId: connectorData.chainId,
      } : undefined,
      wallet: wallet ?? undefined,
    };
  }

  override async getConnectedAccounts(): Promise<string[]> {
    if (this.walletData?.account) {
      return [this.walletData.account];
    }

    let data: { account?: string; chainId?: bigint } | undefined;
    let wallet: StarknetWindowObject | undefined;

    this.logger.debug(
      '[getConnectedAccounts] No existing account, attempting to silently connect',
    );
    try {
      ({ data, wallet } = await this.prompt({
        silently: true,
      }));
    } catch (error) {
      this.logger.debug(
        `[getConnectedAccounts] Silent connect errored out: ${error}`,
      );
      return [];
    }

    this.logger.debug(
      `[getConnectedAccounts] Connect returned account: ${data?.account}`,
    );

    if (!data?.account || !wallet) {
      return [];
    }

    this.walletData = {
      account: data.account,
      chainId: data.chainId,
    };
    this.wallet = wallet;

    this.setupEventListeners();

    return [data.account];
  }

  override async endSession(): Promise<void> {
    await super.endSession();
    await disconnect();
  }
}

export type XverseStarknetWalletConnectorType = XverseStarknetWalletConnector;
