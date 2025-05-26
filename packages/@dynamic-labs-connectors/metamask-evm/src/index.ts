import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';

import { MetamaskConnector } from './MetamaskConnector.js';

export { MetamaskConnector } from './MetamaskConnector.js';

export const MetamaskEvmConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any
): WalletConnectorConstructor[] =>
  [MetamaskConnector];
