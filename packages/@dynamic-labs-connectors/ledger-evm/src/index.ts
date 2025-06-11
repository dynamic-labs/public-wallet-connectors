import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';

import { LedgerEvmWalletConnector } from './LedgerEvmWalletConnector.js';

export { LedgerEvmWalletConnector } from './LedgerEvmWalletConnector.js';

export const LedgerEvmWalletConnectors = (
  _props: any,
): WalletConnectorConstructor[] => [LedgerEvmWalletConnector];
