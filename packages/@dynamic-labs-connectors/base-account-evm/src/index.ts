import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { BaseAccountEvmWalletConnector } from './BaseAccountEvmWalletConnector.js';

export const BaseAccountEvmWalletConnectors = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    _props: any
): WalletConnectorConstructor[] => [BaseAccountEvmWalletConnector];