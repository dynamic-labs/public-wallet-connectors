/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGetProvider = jest.fn();
const mockCreateBaseAccountSDK = jest.fn(() => ({ getProvider: mockGetProvider }));

jest.mock('@base-org/account', () => ({
  createBaseAccountSDK: mockCreateBaseAccountSDK,
}));

// Reimport the module in an isolated environment. 
// This ensures that the singleton `baseAccountProvider` is reset for every test case.
const importHelpers = async () => {
  jest.resetModules();
  return await import('./helpers.js');
};

describe('getBaseAccountProvider', () => {
  beforeEach(() => {
    mockGetProvider.mockReset().mockReturnValue('mockProvider');
    mockCreateBaseAccountSDK.mockClear().mockImplementation(() => ({
      getProvider: mockGetProvider,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('prioritises Base Sepolia (chainId 84532) when present', async () => {
    const { getBaseAccountProvider } = await importHelpers();

    const opts: any = {
      evmNetworks: [
        { chainId: '1' },
        { chainId: '84532' }, // Base Sepolia
        { chainId: '2' },
      ],
    };

    getBaseAccountProvider(opts);

    // Inspect the call made to createBaseAccountSDK to ensure that the
    // generated `appChainIds` array has Base Sepolia first.
    expect(mockCreateBaseAccountSDK).toHaveBeenCalledTimes(1);
    const firstCallArg = (mockCreateBaseAccountSDK.mock.calls as any)[0][0] as any;
    expect((firstCallArg as any).appChainIds[0]).toBe(84532);
  });

  it('prioritises Base Mainnet (chainId 8453) when present', async () => {
    const { getBaseAccountProvider } = await importHelpers();

    const opts: any = {
      evmNetworks: [
        { chainId: '1' },
        { chainId: '8453' }, // Base Mainnet
        { chainId: '2' },
      ],
    };

    getBaseAccountProvider(opts);

    expect(mockCreateBaseAccountSDK).toHaveBeenCalledTimes(1);
    const firstCallArg = (mockCreateBaseAccountSDK.mock.calls as any)[0][0] as any;
    expect((firstCallArg as any).appChainIds[0]).toBe(8453);
  });

  it('caches and returns the same provider instance on subsequent calls', async () => {
    const { getBaseAccountProvider } = await importHelpers();

    const opts: any = { evmNetworks: [{ chainId: '1' }] };

    const provider1 = getBaseAccountProvider(opts);
    const provider2 = getBaseAccountProvider(opts);

    expect(provider1).toBe('mockProvider');
    expect(provider2).toBe(provider1);

    expect(mockCreateBaseAccountSDK).toHaveBeenCalledTimes(1);
  });
});
