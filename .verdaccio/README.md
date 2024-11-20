From the root of the repo:

1. `pnpm verdaccio --config .verdaccio/config.yaml` to start the local npm proxy
2. In a separate terminal window/tab and from the root of this repo: `pnpm nx release publish --registry http://localhost:4873/`


Then in your application run:

`npm i @dynamic-labs-connectors/safe-evm@latest --registry http://localhost:4873/`

To make a change to a package:
1. Manually bump the package.json version of the package you want to change
2. Make youre change
3. Repeat steps publish/install steps above
4. Confirm with `npm ls @dynamic-labs-connectors/safe-evm`