import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';

import { XverseStarknetWalletConnector } from './XverseStarknetWalletConnector.js';
export { XverseStarknetWalletConnector } from './XverseStarknetWalletConnector.js';

export const XverseStarknetWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any,
): WalletConnectorConstructor[] => [XverseStarknetWalletConnector as unknown as WalletConnectorConstructor];
