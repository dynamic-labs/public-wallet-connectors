// import { WalletConnectorConstructor } from "@dynamic-labs/wallet-connector-core";
// import { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';

// export { WalletConnectSolanaConnector } from './WalletConnectSolanaConnector.js';


// export const WalletConnectSolanaConnectors = (
// //   // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- we don't care about the props
// // //   _props: any
// // // ): WalletConnectorConstructor[] =>
// // //   !isInIframe() ? [WalletConnectSolanaConnector] : [];

// _props: any
// ): WalletConnectorConstructor[] => [WalletConnectSolanaConnector];

/////////////////////////////////////////////////////////////////////////////////////////////////////////

import { WalletConnectSolanaConnector as _WalletConnectSolanaConnector } from "./WalletConnectSolanaConnector.js";
import { WalletConnectorConstructor } from "@dynamic-labs/wallet-connector-core";

export const WalletConnectSolanaConnector = (
  _props: any,
): WalletConnectorConstructor[] => {
  _WalletConnectSolanaConnector.projectId = _props.projectId;
  return [_WalletConnectSolanaConnector];
};

