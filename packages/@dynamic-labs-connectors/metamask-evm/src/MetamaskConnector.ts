import {
  type Account,
  createWalletClient,
  custom,
  type Hex,
  isHex,
  type Transport,
  type Chain as ViemChain,
} from 'viem';
import { toAccount } from 'viem/accounts';

import {
  chainsMap,
  EthereumWalletConnector,
  type EthereumWalletConnectorOpts,
} from '@dynamic-labs/ethereum-core';
import { type EvmNetwork } from '@dynamic-labs/types';
import {
  DynamicError,
  parseIntSafe,
  StorageService,
} from '@dynamic-labs/utils';
import {
  type GetAddressOpts,
  type IWalletConnectConnector,
  logger,
} from '@dynamic-labs/wallet-connector-core';
import { MetamaskSdkClient } from './MetamaskSdkClient.js';

const MM_CURRENT_CHAIN_KEY = 'dynamic-mm-current-chain';

export type MetamaskConnectorOpts = EthereumWalletConnectorOpts & {
  appName: string;
  appLogoUrl: string;
};

export class MetamaskConnector
  extends EthereumWalletConnector
  implements IWalletConnectConnector
{
  /**
   * The name of the wallet connector
   */
  name = 'MetaMask';

  /**
   * The override key of the wallet connector
   */
  override overrideKey = 'metamask';

  /**
   * Whether the connector can connect via QR code
   */
  override canConnectViaQrCode = true;

  /**
   * Whether the connector can handle multiple connections
   * Should only be true if extension is installed since we don't 
   * handle multiple connections in the mobile app
   */
  override canHandleMultipleConnections = false;

  constructor(opts: MetamaskConnectorOpts) {
    super(opts);

    const storedChainId = StorageService.getItem(MM_CURRENT_CHAIN_KEY);
    if (storedChainId) {
      this.currentChainId = parseIntSafe(storedChainId);
    }

    MetamaskSdkClient.appName = opts.appName;
    MetamaskSdkClient.appLogoUrl = opts.appLogoUrl;
    MetamaskSdkClient.evmNetworkRpcMap = this.evmNetworkRpcMap();
  }

  override async init() {
    logger.logVerboseTroubleshootingMessage('[MetamaskConnector] init called', {
      isInitialized: MetamaskSdkClient.isInitialized,
      isInitializing: MetamaskSdkClient.isInitializing,
    });

    // we should only init the provider once as soon as possible
    // the connection is established when a wallet is selected (with getAddress)
    if (MetamaskSdkClient.isInitialized || MetamaskSdkClient.isInitializing) {
      logger.debug(
        '[MetamaskConnector] init - already initialized or initializing - skipping',
      );
      return;
    }

    logger.debug('[MetamaskConnector] init');

    this.walletConnectorEventsEmitter.emit('connectorInitStarted', 'metamask');

    try {
      await MetamaskSdkClient.init();
    } catch (error) {
      logger.error('[MetamaskConnector] init - error', error);
      throw new DynamicError('MetamaskSdkClient failed to initialize');
    }

    logger.debug('[MetamaskConnector] init - will setup event listeners');

    this.setupMMEventListeners();

    this.walletConnectorEventsEmitter.emit(
      'connectorInitCompleted',
      'metamask',
    );

    this.canHandleMultipleConnections = this.isInstalledOnBrowser();

    logger.debug('[MetamaskConnector] initiazed', {
      canHandleMultipleConnections: this.canHandleMultipleConnections,
      provider: MetamaskSdkClient.getProvider(),
    });
  }

  private setupMMEventListeners(): void {
    logger.debug('[MetamaskConnector] setupMMEventListeners');

    MetamaskSdkClient.teardownEventListeners();

    MetamaskSdkClient.setupEventListeners({
      onAccountChanged: (account: string) => {
        logger.debug('[MetamaskConnector] onAccountChanged', { account });
        this.emit('accountChange', { accounts: [account] });
      },
      onChainChanged: (chainId: number) => {
        logger.debug('[MetamaskConnector] onChainChange', { chainId });
        if (chainId === this.currentChainId) {
          logger.debug(
            `[MetamaskConnector] onChainChange - ignoring chainChanged event with same chain id as current chain id: ${chainId}`,
          );
          return;
        }

        this.currentChainId = chainId;

        this.emit('chainChange', { chain: String(chainId) });
      },
      // onDisconnect: () => {
      //   logger.debug('[MetamaskConnector] onDisconnect');
      //   this.endSession();
      //   this.emit('disconnect');
      // },
    });
  }

  /**
   * Ends the session
   * Called when user logs out or disconnects from the Dynamic SDK
   * or everytime user selects Metamask wallet from the wallet list to connect with
   */
  override async endSession(): Promise<void> {
    logger.debug('[MetamaskConnector] endSession');
    this.currentChainId = undefined;
    await MetamaskSdkClient.disconnect();
  }

  /**
   * Connects wallet the connected address
   */
  override async getAddress(
    opts?: GetAddressOpts,
  ): Promise<string | undefined> {
    logger.debug('[MetamaskConnector] getAddress', { opts });

    const provider = await MetamaskSdkClient.awaitAndGetProvider();

    logger.debug('[MetamaskConnector] getAddress - connecting to MetaMask', {
      provider,
    });

    const addresses = await MetamaskSdkClient.connect(opts);

    logger.debug(
      '[MetamaskConnector] getAddress - connection result',
      addresses,
    );

    const address = addresses?.[0];

    return address;
  }

  /**
   * Returns the wallet client
   */
  override getWalletClient(chainId?: string) {
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] getWalletClient was called - chainId',
      chainId,
    );

    const provider = MetamaskSdkClient.getProvider();

    if (!provider) {
      logger.debug(
        '[MetamaskConnector] getWalletClient - provider is not initialized',
      );
      throw new DynamicError('MetamaskSdkClient is not initialized');
    }

    const walletClient = createWalletClient<Transport, ViemChain, Account>({
      account: this.getActiveAccount(),
      chain: chainsMap[chainId ?? String(this.currentChainId)],
      transport: custom(provider, this.providersConfig.httpTransportConfig),
    });

    return walletClient;
  }

  /**
   * Signs a message
   */
  override async signMessage(
    messageToSign: string,
  ): Promise<string | undefined> {
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] signMessage',
      { messageToSign },
    );

    const activeAccount = this.getActiveAccount();
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] signMessage - activeAccount',
      activeAccount,
    );

    if (!activeAccount) {
      return;
    }

    const walletClient = await this.getWalletClient();

    return walletClient.signMessage({
      account: activeAccount,
      message: messageToSign,
    });
  }

  /**
   * Returns the connected accounts
   */
  override async getConnectedAccounts(): Promise<string[]> {
    const activeAccount = this.getActiveAccount();

    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] getConnectedAccounts - activeAccount',
      activeAccount,
    );

    return activeAccount ? [activeAccount.address] : [];
  }

  override getActiveAccount(): Account | undefined {
    const provider = MetamaskSdkClient.getProvider();

    const connectedAccount = provider?.getSelectedAddress();
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] getActiveAccount - connectedAccount',
      connectedAccount,
    );

    if (!connectedAccount) {
      return undefined;
    }

    return toAccount(connectedAccount as Hex);
  }

  private get currentChainId() {
    const lsCurrentChain = StorageService.getItem(MM_CURRENT_CHAIN_KEY);

    try {
      return lsCurrentChain ? parseIntSafe(lsCurrentChain) : undefined;
    } catch (e) {
      logger.debug('[MetamaskConnector] getCurrentChainId - error', e);
      return undefined;
    }
  }

  private set currentChainId(value: number | undefined) {
    if (value) {
      StorageService.setItem(MM_CURRENT_CHAIN_KEY, value.toString());
    } else {
      StorageService.removeItem(MM_CURRENT_CHAIN_KEY);
    }
  }

  override getActiveChain(): ViemChain | undefined {
    if (!this.currentChainId) {
      return undefined;
    }

    return chainsMap[this.currentChainId];
  }

  /**
   * Returns the current network
   */
  override async getNetwork(): Promise<number | undefined> {
    logger.logVerboseTroubleshootingMessage('[MetamaskConnector] getNetwork');

    const provider = await MetamaskSdkClient.awaitAndGetProvider();
    const providerChainId = provider?.getChainId();

    if (providerChainId) {
      this.currentChainId = parseIntSafe(
        providerChainId,
        isHex(providerChainId) ? 16 : 10,
      );

      logger.logVerboseTroubleshootingMessage(
        '[MetamaskConnector] getNetwork - provider network',
        providerChainId,
      );
    }

    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] getNetwork - no provider found, returning current chain id',
      {
        currentChainId: this.currentChainId,
      },
    );
    return this.currentChainId;
  }

  override async providerSwitchNetwork({
    network,
  }: {
    network: EvmNetwork;
  }): Promise<void> {
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] providerSwitchNetwork - network',
      {
        network,
        switchNetworkOnlyFromWallet: this.switchNetworkOnlyFromWallet,
      },
    );

    const currentNetworkId = await this.getNetwork();

    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] providerSwitchNetwork - currentNetworkId',
      currentNetworkId,
    );

    if (currentNetworkId && currentNetworkId === network.chainId) {
      return;
    }

    if (this.switchNetworkOnlyFromWallet) {
      throw new DynamicError(
        'Network switching is only supported through the wallet',
      );
    }

    const walletClient = await this.getWalletClient();

    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] providerSwitchNetwork - will switch network',
    );

    await super.providerSwitchNetwork({ network, provider: walletClient });

    this.currentChainId = network.chainId;
    logger.logVerboseTroubleshootingMessage(
      '[MetamaskConnector] providerSwitchNetwork - switched network',
      network.chainId,
    );
    this.emit('chainChange', { chain: String(network.chainId) });
  }

  override supportsNetworkSwitching(): boolean {
    return true;
  }

  public async getSupportedNetworks(): Promise<string[]> {
    return this.evmNetworks.map((network) => network.chainId.toString());
  }

  public getConnectionUri(): string | undefined {
    return MetamaskSdkClient.getConnectionUri();
  }

  override async chooseAccountsToConnect() {
    return [];
  }

  override isInstalledOnBrowser() {
    const isInstalled = MetamaskSdkClient.isInstalledOnBrowser();
    logger.debug('[MetamaskConnector] isInstalledOnBrowser', {
      isInstalled,
    });
    return isInstalled;
  }
}