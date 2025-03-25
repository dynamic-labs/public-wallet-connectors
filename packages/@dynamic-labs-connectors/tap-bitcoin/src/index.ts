import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';


import { TapWalletConnector } from './TapWalletConnector.js';
export { TapWalletConnector } from './TapWalletConnector.js';

export const TapWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any,
): WalletConnectorConstructor[] =>
  isInIframe() ? [  TapWalletConnector as unknown as WalletConnectorConstructor,
  ] : [];

