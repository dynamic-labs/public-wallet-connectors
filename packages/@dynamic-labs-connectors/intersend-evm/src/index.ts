import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';

import { IntersendEvmWalletConnector } from './IntersendEvmWalletConnector';

export { IntersendEvmWalletConnector } from './IntersendEvmWalletConnector';

export const IntersendEvmWalletConnectors = (
  _props: any
): WalletConnectorConstructor[] =>
  isInIframe() ? [IntersendEvmWalletConnector] : [];