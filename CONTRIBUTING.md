# Contributing to Dynamic Labs Connectors

This guide will help you add a new wallet connector package to the Dynamic Labs connectors monorepo.



## Creating a new connector package

1. Create a new directory under `packages/@dynamic-labs-connectors/` with your connector name, e.g: `packages/@dynamic-labs-connectors/mywallet-evm`

2. Add a function that returns an array of connector constructors to the `index.ts` file (see [SafeEvmWalletConnectors](./packages/@dynamic-labs-connectors/safe-evm/src/index.ts) for an example)

3. Create your connector implementation and add it to the `index.ts` file (see [SafeEvmWalletConnector](./packages/@dynamic-labs-connectors/safe-evm/src/SafeEvmWalletConnector.ts) for an example)

4. Add all the required files and configurations to the new package (see [safe-evm](./packages/@dynamic-labs-connectors/safe-evm/) for an example)

## Creating your connector implementation

Your connector implementation should extend the appropriate base connector class and implement the required methods.

- extend `AlgorandWalletConnector` from `@dynamic-labs/algorand` for algorand connectors
- extend `BitcoinWalletConnector` from `@dynamic-labs/bitcoin` for bitcoin connectors
- extend `CosmosWalletConnector` from `@dynamic-labs/cosmos` for cosmos connectors
- extend `EthereumWalletConnector` from `@dynamic-labs/ethereum` for ethereum connectors
  - or extend `EthereumInjectedConnector` from `@dynamic-labs/ethereum` for a more high level abstraction for injected wallets
- extend `FlowWalletConnector` from `@dynamic-labs/flow` for flow connectors
- extend `SolanaWalletConnector` from `@dynamic-labs/solana` for solana connectors
  - or extend `SolanaInjectedConnector` from `@dynamic-labs/solana` for a more high level abstraction for injected wallets
- extend `StarknetWalletConnector` from `@dynamic-labs/starknet` for starknet connectors

### Required props and methods to implement or override

- `name: string` - REQUIRED - string that represents the wallet name, e.g: `'Safe'`, `'MetaMask'`, `'My Wallet'`, etc.

```typescript
    override name = 'My Wallet';
```

- `canConnectViaCustodialService: boolean` - REQUIRED if the wallet does not inject the provider - should return `true`(default is `false`)

```typescript
    override canConnectViaCustodialService = true;
```

- `constructor: (props: WalletConnectorOpts) => void` - REQUIRED - should call the super constructor with the appropriate options and initialize the wallet

```typescript
constructor(props: WalletConnectorOpts) {
    // call the super constructor with the `props` argument and add the `metadata` property,
    super({ ...props, metadata: { id: 'mywallet', name: 'My Wallet', icon: 'http://url.to.my.icon' } });
}
```

- `init: () => Promise<void>` - REQUIRED - should initialize the connector client/sdk

```typescript
    override async init(): Promise<void> {
       // here you should initialize the connector client/sdk

       // this function can be called multiple times, so you must have a flag that indicates if the connector is already initialized
       // (can't be an instance variable, because it will be reset every time the connector is instantiated)
       // once the provider is initialized, you should emit the providerReady event once, and only once


        this.walletConnectorEventsEmitter.emit('providerReady', {
            connector: this,
        });
    }
```

- `findProvider: () => IEthereum | undefined` - REQUIRED if the connector extends `EthereumInjectedConnector` - should return the wallet provider

```typescript
    override findProvider(): IEthereum | undefined {
        // here you should return the wallet provider
    }
```

- `findProvider: () => ISolana | undefined` - REQUIRED if the connector extends `SolanaInjectedConnector` - should return the wallet provider

```typescript
    override findProvider(): ISolana | undefined {
        // here you should return the wallet provider
    }
```

- `getAddress: () => Promise<string | undefined>` - REQUIRED - should return the address of the connected wallet

```typescript
    override async getAddress(): Promise<string | undefined> {
        // should initate a connection if not already connected
        // then return the address of the connected wallet
    }
```

- `getConnectedAccounts: () => Promise<string[]>` - REQUIRED - should return the connected accounts

```typescript
    override async getConnectedAccounts(): Promise<string[]> {
        // should return an array of addresses of the connected accounts
        // or an empty array if no accounts are connected

        // if it's an Ethereum connector, before returning it should call this.setActiveAccount() with the address of the connected account
        // this.setActiveAccount(connectedAccount);

        // NOTE: it should not initiate a connection, it should only return the connected accounts
    }
```

- `sendBitcoin: (transaction: BitcoinTransaction) => Promise<string | undefined>` - REQUIRED if the connector extends `BitcoinWalletConnector` - should return the transaction hash

```typescript
    override async sendBitcoin(transaction: BitcoinTransaction): Promise<string | undefined> {
        // here you should send the bitcoin transaction and return the transaction hash
    }
```

- `signPsbt: (request: BitcoinSignPsbtRequest[]) => Promise<string[] | undefined>` - OPTIONAL if the connector extends `BitcoinWalletConnector` - should return the signed psbts

If this method is not implemented, it will fallback to the default implementation in the base class, which just loops through the requests and signs each one individually

```typescript
    override async signPsbt(request: BitcoinSignPsbtRequest[]): Promise<string[] | undefined> {
        // here you should sign the psbt and return the signed psbt
    }
```

- `signPsbts: (request: BitcoinSignPsbtsRequest) => Promise<BitcoinSignPsbtsResponse | undefined>` - REQUIRED if the connector extends `BitcoinWalletConnector` - should return the signed psbts

```typescript
    override async signPsbts(request: BitcoinSignPsbtsRequest): Promise<BitcoinSignPsbtsResponse | undefined> {
        // here you should sign the psbts and return the signed psbts
    }
```

- `signMessage: (messageToSign: string) => Promise<string | undefined>` - REQUIRED - should return the signed message

```typescript
    override async signMessage(messageToSign: string): Promise<string | undefined> {
        // here you should sign the message and return the signed message
    }
```

- `supportsNetworkSwitching: () => boolean` - OPTIONAL - override this to return the appropriate value based on if the wallet supports network switching or not and the type of connector you are extending

For Ethereum connectors, it defaults to `true`, so you should override it if your connector does not support network switching
For all other connectors, it defaults to `false`, so you should override it if your connector does support network switching

```typescript
    override supportsNetworkSwitching(): boolean {
        return false;
    }
```

- `filter: () => boolean` - OPTIONAL - should return `false` if the provider is not ready or available to be used (default is `true`)

This will ensure the connector is not added to the available connectors list if the provider is not ready and it will only be added when the providerReady event is emitted

```typescript
    override filter(): boolean {
        return Boolean(this.findProvider());
    }
```

## Releasing

To get your custom connector released, you should follow these steps:
1. open a PR poiting to main with your new package 
2. Dynamic will review the PR and if it looks good, it will get merged
3. once merged, Dynamic will release

### Things to check before submitting a PR

- you have added unit tests
- there are no lint issues
- there are no build issues
- code is clean and well structured (helpers/utils on their own files, classes own their own files, etc)

