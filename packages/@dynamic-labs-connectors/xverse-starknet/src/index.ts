import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';

import { Xverse } from './Xverse.js';
export { Xverse } from './Xverse.js';

export const XverseWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any,
): WalletConnectorConstructor[] => [Xverse as unknown as WalletConnectorConstructor];
