# Base Account EVM

## Integrating with the Dynamic SDK

### Install the connector

```
npm install @dynamic-labs-connectors/base-account-evm
```

### Use the connector

Use the factory `createBaseAccountConnector` to pass Base Account SDK options into the connector. The factory returns a `walletConnectors` method compatible with `DynamicContextProvider`.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import {
  createBaseAccountConnector,
  type BaseAccountSDKOpts,
} from '@dynamic-labs-connectors/base-account-evm';

// optional params from Base Account SDK
// check out https://docs.base.org/base-account/reference/core/createBaseAccount for all params
const baseAccountOpts: BaseAccountSDKOpts = {
  preference: {
    attribution: { auto: true },
  },
  paymasterUrls: {
    8453: 'https://paymaster.base.org/api/v1/sponsor',
    84532: 'https://paymaster.base-sepolia.org/api/v1/sponsor',
  },
};

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [createBaseAccountConnector(baseAccountOpts)],
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
