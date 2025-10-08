import { disconnect, type StarknetWindowObject } from 'starknetkit';
import { StarknetWalletConnector } from '@dynamic-labs/starknet';

export abstract class XverseBase extends StarknetWalletConnector {
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

    this.walletData = data;
    this.wallet = wallet;

    this.setupEventListeners();

    return [data.account];
  }

  override async endSession(): Promise<void> {
    await super.endSession();
    await disconnect();
  }
}
