// Mock implementation of @coinbase/wallet-sdk
module.exports = {
  CoinbaseWalletSDK: jest.fn().mockImplementation(() => ({
    makeWeb3Provider: jest.fn().mockReturnValue({
      request: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      removeListener: jest.fn(),
      disconnect: jest.fn().mockResolvedValue(true),
      enable: jest.fn().mockResolvedValue(['0x123']),
      close: jest.fn().mockResolvedValue(true),
      sendAsync: jest.fn(),
      send: jest.fn(),
    }),
  })),
};
