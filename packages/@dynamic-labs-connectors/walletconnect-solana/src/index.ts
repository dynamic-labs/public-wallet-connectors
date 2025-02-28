import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';
import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';

export { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';


export const WalletConnectSolanaConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any
): WalletConnectorConstructor[] =>
  isInIframe() ? [WalletConnectSolanaConnector] : [];
