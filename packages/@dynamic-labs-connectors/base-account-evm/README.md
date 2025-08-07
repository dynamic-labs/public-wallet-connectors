# Base Account EVM

## Integrating with the Dynamic SDK

### Install the connector

```
npm install @dynamic-labs-connectors/base-account-evm
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `BaseAccountEvmWalletConnector` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import { BaseAccountEvmWalletConnector } from '@dynamic-labs-connectors/base-account-evm';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [BaseAccountEvmWalletConnector],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```

## Building

Run `nx build @dynamic-labs-connectors/base-account-evm` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/base-account-evm` to execute the unit tests via [Jest](https://jestjs.io).
