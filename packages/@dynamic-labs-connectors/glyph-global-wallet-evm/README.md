# Glyph Global Wallet EVM

## Integrating with the Dynamic SDK

### Install the connector
Make sure to install the connector with the correct version (@3 for sdk v3, @4 for sdk v4, etc...):


```
npm install @dynamic-labs-connectors/glyph-global-wallet-evm@4
```

### Use the connector

To integrate with the Dynamic SDK, you just need to pass `GlyphEvmWalletConnector` to the `walletConnectors` prop of the `DynamicContextProvider` component.

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-score';
import { GlyphEvmWalletConnector } from '@dynamic-labs-connectors/glyph-global-wallet-evm';

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'REPLACE-WITH-YOUR-ENVIRONMENT-ID',
        walletConnectors: [GlyphEvmWalletConnector],
      }}
    >
      <DynamicWidget />
    </DynamicContextProvider>
  );
};
```


## Building

Run `nx build @dynamic-labs-connectors/glyph-global-wallet-evm` to build the library.

## Running unit tests

Run `nx test @dynamic-labs-connectors/glyph-global-wallet-evm` to execute the unit tests via [Jest](https://jestjs.io).


