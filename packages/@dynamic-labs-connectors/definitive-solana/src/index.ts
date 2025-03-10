import { type WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';

// import { SafeEvmWalletConnector } from './SafeEvmWalletConnector.js';

// export { SafeEvmWalletConnector } from './SafeEvmWalletConnector.js';
import { DefinitiveSolanaWalletConnector } from './DefinitiveSolanaWalletConnector.js';

export { DefinitiveSolanaWalletConnector } from './DefinitiveSolanaWalletConnector.js';


export const DefinitiveSolanaWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
  _props: any
): WalletConnectorConstructor[] =>
  isInIframe() ? [DefinitiveSolanaWalletConnector] : [];
