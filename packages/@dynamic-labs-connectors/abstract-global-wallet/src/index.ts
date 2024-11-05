import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { AbstractEvmWalletConnector } from './AbstractEvmWalletConnector.js';

export const AbstractEvmWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any
): WalletConnectorConstructor[] => [AbstractEvmWalletConnector];
