import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';

import { IntersendEvmWalletConnector } from './IntersendEvmWalletConnector.js';

export { IntersendEvmWalletConnector } from './IntersendEvmWalletConnector.js';

export const IntersendEvmWalletConnectors = (
  _props: any
): WalletConnectorConstructor[] =>
  isInIframe() ? [IntersendEvmWalletConnector] : [];