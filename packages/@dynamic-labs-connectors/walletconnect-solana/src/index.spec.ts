// WalletConnectSolanaConnector.index.test.ts
import { env } from "process";
import { WalletConnectSolanaConnector as ConnectorIndex } from "./index";
import { WalletConnectSolanaConnector as _WalletConnectSolanaConnector } from "./WalletConnectSolanaConnector.js";

describe("WalletConnectSolanaConnector index file", () => {
  beforeEach(() => {
    // Reset the static projectId before each test
    _WalletConnectSolanaConnector.projectId = env["ENVIRONMENT_ID"] ?? " ";
  });

  test("should set projectId on the connector and return it in an array", () => {
    const testProjectId = env["ENVIRONMENT_ID"] ?? " ";
    const connectors = ConnectorIndex({ projectId: testProjectId });
    expect(connectors).toHaveLength(1);
    // Check that the returned connector is the same as the one imported
    expect(connectors[0]).toBe(_WalletConnectSolanaConnector);
    // Verify that the static projectId was set correctly
    expect(_WalletConnectSolanaConnector.projectId).toBe(testProjectId);
  });
});
