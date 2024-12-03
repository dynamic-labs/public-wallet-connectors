# intersend-evm

## Integrating with the Dynamic SDK

### Install the connector

```
npm install @dynamic-labs-connectors/intersend-evm
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `IntersendEvmConnectors` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import { IntersendEvmConnectors } from '@dynamic-labs-connectors/intersend-evm';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [IntersendEvmConnectors],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```


## Building

Run `nx build intersend-evm` to build the library.

## Running unit tests

Run `nx test intersend-evm` to execute the unit tests via [Jest](https://jestjs.io).


