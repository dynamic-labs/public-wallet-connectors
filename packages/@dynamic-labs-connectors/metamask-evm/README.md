# metamask-evm

## Integrating with the Dynamic SDK

### Install the connector

Make sure to install the connector with the correct version (@3 for sdk v3, @4 for sdk v4, etc...):

```
npm install @dynamic-labs-connectors/metamask-evm
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `MetamaskEvmConnectors` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import { MetamaskEvmConnectors } from '@dynamic-labs-connectors/metamask-evm';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [MetamaskEvmConnectors],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```

## Building

Run `nx build @dynamic-labs-connectors/metamask-evm` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/metamask-evm` to execute the unit tests via [Jest](https://jestjs.io).
