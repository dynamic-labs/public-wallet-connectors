import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import UniversalProvider from '@walletconnect/universal-provider';
import { universalProviderClient, UniversalProviderClient } from './SolanaUniversalProvider';

// --- Mocks setup ---

// Dummy public key string and instance.
const dummyPublicKeyStr = '11111111111111111111111111111111';
const dummyPublicKey = new PublicKey(dummyPublicKeyStr);

// Dummy approval function that resolves to a session object.
const dummyApproval = jest.fn().mockResolvedValue({
  namespaces: {
    solana: {
      accounts: [dummyPublicKeyStr],
    },
  },
});

// Dummy connect method that resolves with a URI and approval function.
const dummyConnect = jest.fn().mockResolvedValue({
  uri: 'dummy-uri',
  approval: dummyApproval,
});

// Dummy disconnect method.
const dummyDisconnect = jest.fn().mockResolvedValue(undefined);

// Dummy request method (will be configured per test).
const dummyRequest = jest.fn();

// Dummy provider that the mocked UniversalProvider.init will resolve to.
const dummyProvider = {
  client: {
    connect: dummyConnect,
    disconnect: dummyDisconnect,
  },
  request: dummyRequest,
};

// Mock the UniversalProvider module.
jest.mock('@walletconnect/universal-provider', () => ({
  init: jest.fn(),
}));

// Type assertion to help with the mock.
const mockedUniversalProviderInit = UniversalProvider.init as jest.Mock;

// Reset the singleton state between tests.
afterEach(() => {
  // Reset the internal provider and connection state.
  (universalProviderClient as any)._provider = undefined;
  (universalProviderClient as any)._isConnected = false;
  (universalProviderClient as any)._connectionUri = undefined;
  jest.clearAllMocks();
});

describe('UniversalProviderClient', () => {
  describe('init & connect', () => {
    test('init should initialize provider and connect', async () => {
      // When init is first called in init(), then again in getPublicKey(), so return our dummy provider.
      mockedUniversalProviderInit.mockResolvedValue(dummyProvider);

      await universalProviderClient.init();

      // The first init call should be with the hardcoded projectId.
      expect(mockedUniversalProviderInit).toHaveBeenCalledWith({
        projectId: '7569c63c696a4e8aeb3217c1b1332bd7',
      });
      // In the connect method (called inside init), client.connect is invoked.
      expect(dummyConnect).toHaveBeenCalled();
    });

    test('connect should return a connection result with publicKey', async () => {
      // Setup _provider manually.
      (universalProviderClient as any)._provider = dummyProvider;
      // Make sure approval returns a session with a valid Solana namespace.
      dummyApproval.mockResolvedValueOnce({
        namespaces: {
          solana: {
            accounts: [dummyPublicKeyStr],
          },
        },
      });

      const result = await universalProviderClient.connect();
      expect(result).toHaveProperty('publicKey');
    });
  });

  describe('signMessage', () => {
    test('signMessage should return a signed message', async () => {
      // Setup provider and connected state.
      (universalProviderClient as any)._provider = dummyProvider;
      (universalProviderClient as any)._isConnected = true;
      const dummyMessage = new Uint8Array([1, 2, 3]);

      // Simulate provider.request returning a base64-encoded signature string.
      const base64Sig = Buffer.from('signature').toString('base64');
      dummyRequest.mockResolvedValueOnce(base64Sig);

      const result = await universalProviderClient.signMessage(dummyMessage);

      expect(dummyProvider.request).toHaveBeenCalledWith({
        method: 'solana_signMessage',
        params: [Buffer.from(dummyMessage).toString('base64'), 'base64'],
      });
      expect(result.signature).toEqual(Buffer.from(base64Sig, 'base64'));
    });

    test('signMessage should throw error if provider is not connected', async () => {
      (universalProviderClient as any)._provider = dummyProvider;
      (universalProviderClient as any)._isConnected = false;

      await expect(
        universalProviderClient.signMessage(new Uint8Array([1, 2, 3]))
      ).rejects.toThrow('Provider not connected');
    });
  });

  describe('signTransaction', () => {
    test('signTransaction should return a signed transaction', async () => {
      (universalProviderClient as any)._provider = dummyProvider;
      (universalProviderClient as any)._isConnected = true;

      // Create a dummy transaction with a serialize() method.
      const dummyTx = {
        serialize: jest.fn().mockReturnValue(Buffer.from('tx')),
      } as unknown as Transaction;

      // Simulate provider.request returning a base64 string.
      const signedTxBase64 = Buffer.from('signedTx').toString('base64');
      dummyRequest.mockResolvedValueOnce(signedTxBase64);

      // Spy on VersionedTransaction.deserialize to simulate deserialization.
      const dummySignedTx = { deserialized: true };
      const deserializeSpy = jest
        .spyOn(VersionedTransaction, 'deserialize')
        .mockReturnValue(dummySignedTx as any);

      const result = await universalProviderClient.signTransaction(dummyTx);
      expect(dummyProvider.request).toHaveBeenCalledWith({
        method: 'solana_signTransaction',
        params: [dummyTx.serialize().toString('base64')],
      });
      expect(deserializeSpy).toHaveBeenCalledWith(Buffer.from(signedTxBase64, 'base64'));
      expect(result).toEqual(dummySignedTx);
      deserializeSpy.mockRestore();
    });
  });

  describe('signAllTransactions', () => {
    test('signAllTransactions should sign multiple transactions', async () => {
      (universalProviderClient as any)._provider = dummyProvider;
      (universalProviderClient as any)._isConnected = true;

      const dummyTx1 = {
        serialize: jest.fn().mockReturnValue(Buffer.from('tx1')),
      } as unknown as Transaction;
      const dummyTx2 = {
        serialize: jest.fn().mockReturnValue(Buffer.from('tx2')),
      } as unknown as Transaction;
      const transactions = [dummyTx1, dummyTx2];

      // Spy on signTransaction to simulate signing each transaction.
      const signedTx1 = { deserialized: 'tx1' };
      const signedTx2 = { deserialized: 'tx2' };
      const signTransactionSpy = jest
        .spyOn(universalProviderClient, 'signTransaction')
        .mockImplementationOnce(async () => signedTx1 as any)
        .mockImplementationOnce(async () => signedTx2 as any);

      const result = await universalProviderClient.signAllTransactions(transactions);
      expect(result).toEqual([signedTx1, signedTx2]);
      signTransactionSpy.mockRestore();
    });
  });

  describe('signAndSendTransaction', () => {
    test('signAndSendTransaction should sign and send a transaction', async () => {
      (universalProviderClient as any)._provider = dummyProvider;
      (universalProviderClient as any)._isConnected = true;

      const dummyTx = {
        serialize: jest.fn().mockReturnValue(Buffer.from('tx')),
      } as unknown as Transaction;

      // Spy on signTransaction to simulate signing.
      const signTransactionSpy = jest
        .spyOn(universalProviderClient, 'signTransaction')
        .mockResolvedValue(dummyTx as any);

      // Simulate provider.request for sending the transaction.
      const txSignature = 'tx-signature';
      dummyRequest.mockResolvedValueOnce(txSignature);
      const options = { skipPreflight: true };

      const result = await universalProviderClient.signAndSendTransaction(dummyTx, options);
      expect(signTransactionSpy).toHaveBeenCalledWith(dummyTx);
      expect(dummyProvider.request).toHaveBeenCalledWith({
        method: 'solana_sendTransaction',
        params: [dummyTx.serialize().toString('base64'), options],
      });
      expect(result).toEqual({ signature: txSignature });
      signTransactionSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    test('disconnect should call provider client disconnect', async () => {
      (universalProviderClient as any)._provider = dummyProvider;
      await universalProviderClient.disconnect();
      expect(dummyDisconnect).toHaveBeenCalled();
    });
  });
});
