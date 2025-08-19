import { createBaseAccountSDK } from '@base-org/account';

// Inherit the type from Base Account SDK for maximum compatibility
export type BaseAccountSDKOpts = Omit<Parameters<typeof createBaseAccountSDK>[0], 'appChainIds' | 'appName' | 'appLogoUrl'>;