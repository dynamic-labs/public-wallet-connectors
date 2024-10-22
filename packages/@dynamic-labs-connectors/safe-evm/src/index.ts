import { assertPackageVersion } from '@dynamic-labs/assert-package-version';
import { WalletConnectorConstructor } from '@dynamic-labs/wallet-connector-core';
import { isInIframe } from '@dynamic-labs/utils';

import { version as packageVersion } from '../package.json';

import { SafeEvmWalletConnector } from './SafeEvmWalletConnector';

assertPackageVersion('@dynamic-labs/safe-evm', packageVersion);

export * from './SafeEvmWalletConnector';

export const SafeEvmWalletConnectors = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: any
): WalletConnectorConstructor[] =>
  isInIframe() ? [SafeEvmWalletConnector] : [];
