import { WalletConnectSolanaConnector as _WalletConnectSolanaConnector } from "./WalletConnectSolanaConnector.js";
import { WalletConnectorConstructor } from "@dynamic-labs/wallet-connector-core";

export const WalletConnectSolanaConnector = (
  _props: any,
): WalletConnectorConstructor[] => {
  _WalletConnectSolanaConnector.projectId = _props.projectId;
  return [_WalletConnectSolanaConnector];
};

