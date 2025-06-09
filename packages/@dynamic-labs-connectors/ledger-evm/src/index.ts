import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';

import { LedgerEvmWalletConnector } from './LedgerEvmWalletConnector.js';

export { LedgerEvmWalletConnector } from './LedgerEvmWalletConnector.js';

export const LedgerEvmWalletConnectors = (
  _props: any,
): WalletConnectorConstructor[] =>
  isInIframe() ? [LedgerEvmWalletConnector] : [];
