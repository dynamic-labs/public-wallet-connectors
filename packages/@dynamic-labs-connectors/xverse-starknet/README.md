# xverse-starknet

## Integrating with the Dynamic SDK

### Install the connector

```
npm install @dynamic-labs-connectors/xverse-starknet
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `XverseStarknetWalletConnectors` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { XverseStarknetWalletConnectors } from '@dynamic-labs-connectors/xverse-starknet';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [XverseStarknetWalletConnectors],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```

## Building

Run `nx build @dynamic-labs-connectors/xverse-starknet` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/xverse-starknet` to execute the unit tests via [Jest](https://jestjs.io).
