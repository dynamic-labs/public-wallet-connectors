# ledger-evm

## Integrating with the Dynamic SDK

### Install the connector

```
npm install @dynamic-labs-connectors/ledger-evm
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `LedgerEvmConnectors` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import { LedgerEvmConnectors } from '@dynamic-labs-connectors/ledger-evm';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [LedgerEvmConnectors],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```

## Building

Run `nx build @dynamic-labs-connectors/ledger-evm` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/ledger-evm` to execute the unit tests via [Jest](https://jestjs.io).
