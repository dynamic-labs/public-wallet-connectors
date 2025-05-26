import { MetaMaskSDK, type RPC_URLS_MAP } from '@metamask/sdk';
import { isHex, toHex } from 'viem';

import {
  type GetAddressOpts,
  logger,
} from '@dynamic-labs/wallet-connector-core';
import {
  DynamicError,
  ErrorCode,
  isMobile,
  parseIntSafe,
  PlatformService,
} from '@dynamic-labs/utils';

const getReadonlyRPCMap = (evmNetworkRpcMap: Record<string, string>) =>
  Object.keys(evmNetworkRpcMap).reduce(
    (acc, chainId) => ({
      ...acc,
      [toHex(parseInt(chainId))]:
        evmNetworkRpcMap[chainId as unknown as number],
    }),
    {} as RPC_URLS_MAP,
  );

export class MetamaskSdkClient {
  static isInitializing = false;
  static isInitialized = false;
  static evmNetworkRpcMap: Record<string, string> = {};
  static appName: string;
  static appLogoUrl: string;

  private static metaMaskSDK: MetaMaskSDK | null = null;

  /**
   * The connection URI for the current connection.
   */
  private static connectionUri: string | undefined;

  private static eventListenersSetup = false;
  private static accountChangedHandler: (props: any) => void = () => {};
  private static chainChangedHandler: (props: any) => void = () => {};
  private static disconnectHandler: (props: any) => void = () => {};

  private constructor() {
    throw new Error('MetamaskSdkClient is not instantiable');
  }

  /**
   * Initializes the SDK. This method should only be called once.
   * Does not start a connection.
   */
  static init = async () => {
    logger.debug('[MetamaskSdkClient] init', {
      isInitialized: MetamaskSdkClient.isInitialized,
      isInitializing: MetamaskSdkClient.isInitializing,
    });

    if (MetamaskSdkClient.isInitializing || MetamaskSdkClient.isInitialized) {
      return;
    }

    MetamaskSdkClient.isInitializing = true;

    logger.debug('[MetamaskSdkClient] initializing');

    const dappMetadata = {
      iconUrl: MetamaskSdkClient.appLogoUrl,
      name: MetamaskSdkClient.appName,
      url: PlatformService.getOrigin(),
    };

    MetamaskSdkClient.metaMaskSDK = new MetaMaskSDK({
      checkInstallationImmediately: false,
      dappMetadata,
      enableAnalytics: false,
      extensionOnly: true,
      headless: true,
      injectProvider: false,
      openDeeplink: PlatformService.openURL,
      preferDesktop: true,
      readonlyRPCMap: getReadonlyRPCMap(MetamaskSdkClient.evmNetworkRpcMap),
      useDeeplink: true,
    });

    logger.logVerboseTroubleshootingMessage(
      '[MetamaskSdkClient] createMetaMaskSDK - created sdk',
      {
        isInitialized: MetamaskSdkClient.metaMaskSDK.isInitialized,
        metaMaskSDK: MetamaskSdkClient.metaMaskSDK,
      },
    );

    // await MetamaskSdkClient.metaMaskSDK.init();
    await MetamaskSdkClient.metaMaskSDK.sdkInitPromise;

    MetamaskSdkClient.isInitialized = true;
    MetamaskSdkClient.isInitializing = false;

    logger.debug('[MetamaskSdkClient] initialized');
  };

  /**
   * Connects to a wallet. This method should be called whenever a new wallet connection is needed.
   * If the wallet is already connected when the page is refreshed, this method does not need to be called.
   */
  static connect = async (connectionOpts?: GetAddressOpts) => {
    const handleDisplayURI = (uri: string) => {
      logger.debug('[MetamaskSdkClient] handleDisplayURI', uri);

      MetamaskSdkClient.connectionUri = uri;

      connectionOpts?.onDisplayUri?.(uri);

      logger.debug('[MetamaskSdkClient] removing display_uri event listener');
      MetamaskSdkClient.metaMaskSDK?.off('display_uri', handleDisplayURI);
    };

    logger.debug('[MetamaskSdkClient] connect', {
      metaMaskSDK: MetamaskSdkClient.metaMaskSDK,
      connectionUri: MetamaskSdkClient.connectionUri,
    });

    if (!MetamaskSdkClient.metaMaskSDK) {
      logger.error('[MetamaskSdkClient] connect - SDK is not initialized');
      throw new DynamicError('MetamaskSdkClient is not initialized');
    }

    const isExtensionActive = MetamaskSdkClient.isInstalledOnBrowser();

    logger.debug('[MetamaskSdkClient] connect', {
      isExtensionActive,
    });

    if (!isExtensionActive) {
      // this is in case the user just cancels the deeplink prompt (i.e. in mobile/Safari)
      // in this case, the connection is not rejected, so the "enable" promise is just pending
      // so on retry, we should just use the same uri to handle that promise
      if (MetamaskSdkClient.connectionUri) {
        handleDisplayURI(MetamaskSdkClient.connectionUri);
        return;
      }

      logger.debug('[MetamaskSdkClient] adding display_uri event listener');
      
      MetamaskSdkClient.metaMaskSDK.on('display_uri', handleDisplayURI);
    }

    try {
      const result = await MetamaskSdkClient.metaMaskSDK.connect();

      logger.debug('[MetamaskSdkClient] connected to MetaMask', result);

      return result;
    } catch (error) {
      logger.error(
        '[MetamaskSdkClient] Failed to connect to MetaMask',
        error as string,
      );

      if (
        typeof error !== 'object' ||
        error === null ||
        !('message' in error) ||
        typeof error.message !== 'string'
      ) {
        throw error;
      }

      const customError = new DynamicError(error.message);

      if (error.message.includes('rejected')) {
        customError.code = ErrorCode.CONNECTION_REJECTED;
      } else if (error.message.includes('expired')) {
        customError.code = ErrorCode.CONNECTION_PROPOSAL_EXPIRED;
      }

      throw customError;
    } finally {
      // Reset the connection URI after it's been consumed
      MetamaskSdkClient.connectionUri = undefined;
    }
  };

  /**
   * Disconnects from a wallet. This method should be called whenever we need to disconnect from a wallet.
   * It will kill the connection, but not the provider.
   */
  static disconnect = async () => {
    if (!MetamaskSdkClient.metaMaskSDK) {
      logger.debug('[MetamaskSdkClient] disconnect - SDK is not initialized');
      return;
    }

    MetamaskSdkClient.connectionUri = undefined;

    logger.debug('[MetamaskSdkClient] disconnecting from MetaMask');
    try {
      await MetamaskSdkClient.metaMaskSDK.terminate();
      if (!isMobile()) {
        return;
      }

      /**
       * The MetaMask SDK must be terminated and reinitialized on mobile
       * to prevent deeplinks not working
       */
      MetamaskSdkClient.isInitializing = false;
      MetamaskSdkClient.isInitialized = false;
      MetamaskSdkClient.metaMaskSDK = null;
      MetamaskSdkClient.init();
    } catch (error) {
      logger.error(
        '[MetamaskSdkClient] Failed to disconnect from MetaMask',
        error as string,
      );
    }
  };

  /**
   * Waits for the provider to be initialized and returns the SDKProvider instance.
   * We should use this wherever possible (async methods), to ensure the provider is initialized.
   */
  static awaitAndGetProvider = async () => {
    await MetamaskSdkClient.metaMaskSDK?.sdkInitPromise;

    const provider = await MetamaskSdkClient.metaMaskSDK?.getProvider();

    return provider;
  };

  /**
   * Returns the SDKProvider instance.
   * Used when we need to access the provider synchronously.
   */
  static getProvider = () => {
    const provider = MetamaskSdkClient.metaMaskSDK?.getProvider();

    return provider;
  };

  static getConnectionUri = () => MetamaskSdkClient.connectionUri;

  private static handleChainChangedEvent = (
    chain: string,
    onChainChanged?: (chainId: number) => void,
  ) => {
    logger.debug('[MetamaskSdkClient] handling chain change event', {
      chain,
    });

    const chainId = parseIntSafe(chain, isHex(chain) ? 16 : 10);

    if (!chainId) {
      return;
    }

    onChainChanged?.(chainId);
  };

  private static handleAccountChangedEvent = (
    accounts: string[],
    onAccountChanged?: (account: string) => void,
  ) => {
    logger.debug('[MetamaskSdkClient] handling account change event', {
      accounts,
    });

    const [address] = accounts;

    if (!address) {
      return;
    }

    onAccountChanged?.(address);
  };

  /**
   * Sets up event listeners for the provider.
   */
  static setupEventListeners = ({
    onChainChanged,
    onAccountChanged,
    onDisconnect,
  }: {
    onChainChanged?: (chainId: number) => void;
    onAccountChanged?: (account: string) => void;
    onDisconnect?: () => void;
  }) => {
    const provider = MetamaskSdkClient.getProvider();
    if (!provider || MetamaskSdkClient.eventListenersSetup) {
      return;
    }

    MetamaskSdkClient.chainChangedHandler = (chainId: string) => {
      this.handleChainChangedEvent(chainId, onChainChanged);
    };
    MetamaskSdkClient.accountChangedHandler = (accounts: string[]) => {
      this.handleAccountChangedEvent(accounts, onAccountChanged);
    };
    MetamaskSdkClient.disconnectHandler = () => {
      logger.debug('[MetamaskSdkClient] handling disconnect event');
      onDisconnect?.();
    };

    provider.on('accountsChanged', MetamaskSdkClient.accountChangedHandler);
    provider.on('chainChanged', MetamaskSdkClient.chainChangedHandler);
    provider.on('disconnect', MetamaskSdkClient.disconnectHandler);

    MetamaskSdkClient.eventListenersSetup = true;
  };

  /**
   * Tears down event listeners for the provider.
   */
  static teardownEventListeners = (): void => {
    const provider = MetamaskSdkClient.getProvider();
    if (!provider || !MetamaskSdkClient.eventListenersSetup) {
      return;
    }

    provider.off('accountsChanged', MetamaskSdkClient.accountChangedHandler);
    provider.off('chainChanged', MetamaskSdkClient.chainChangedHandler);
    provider.off('disconnect', MetamaskSdkClient.disconnectHandler);

    MetamaskSdkClient.eventListenersSetup = false;
  };

  static isInstalledOnBrowser = () => {
    return Boolean(MetamaskSdkClient.metaMaskSDK?.isExtensionActive());
  };
}