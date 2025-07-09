# tap-bitcoin

## Integrating with the Dynamic SDK

## Installation

To install and integrate tap-bitcoin, make sure you are using:
@dynamic-labs/sdk-react-core version 4.20.1 or higher

```
npm install @dynamic-labs-connectors/tap-bitcoin
```

```tsx
import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import { TapWalletConnectors } from "@dynamic-labs-connectors/tap-bitcoin";

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [TapWalletConnectors, BitcoinWalletConnectors],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```

## Building

Run `nx build @dynamic-labs-connectors/tap-bitcoin` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/tap-bitcoin` to execute the unit tests via [Jest](https://jestjs.io).


