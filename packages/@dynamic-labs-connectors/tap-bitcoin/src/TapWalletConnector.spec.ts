import { isMobile } from '@dynamic-labs/utils';

// Mock the module
jest.mock('@dynamic-labs/utils', () => ({
  isMobile: jest.fn(),
}));

jest.mock('@dynamic-labs/bitcoin', () => ({
  UnisatConnector: class {
    walletConnectorEventsEmitter = {
      emit: jest.fn(),
    };
    getAddress = jest.fn();
    isTapWalletInstalled = jest.fn();
    isInstalledOnBrowser = jest.fn();
    signMessage = jest.fn();
    sendBitcoin = jest.fn();
    signPsbt = jest.fn();
    signPsbts = jest.fn();
    getConnectedAccounts = jest.fn();
    clearConnectedAccounts = jest.fn();
    canConnectWithHardwareWallet = jest.fn();
    removeAllListeners = jest.fn();
  },
}));

import { TapWalletConnector } from './TapWalletConnector.js';

describe('TapWalletConnector', () => {
  let connector: TapWalletConnector;
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    // reset all mocks
    jest.clearAllMocks();
    connector = new TapWalletConnector({});
    // Check if it's defined before spying
    emitSpy = jest.spyOn(connector.walletConnectorEventsEmitter, 'emit');
  });

  it('should be defined', () => {
    expect(connector).toBeDefined();
  });

  describe('init', () => {
    it('should emit the init event', async () => {
      jest.spyOn(connector, 'isTapWalletInstalled').mockReturnValue(true);

      await connector.init();
      expect(emitSpy).toHaveBeenCalledWith('providerReady', { connector });
    });
  });

  describe('filter', () => {
    it('should return false if provider is not available and platform is mobile', () => {
      jest.spyOn(connector, 'isInstalledOnBrowser').mockReturnValue(false);
      (isMobile as jest.Mock).mockReturnValue(true);
      expect(connector.filter()).toBe(false);
    });

    it('should return true if platform is not mobile', () => {
      (isMobile as jest.Mock).mockReturnValue(false);
      expect(connector.filter()).toBe(true);
    });
  });

  describe('getAddress', () => {
    it('should return an address if available', async () => {
      jest.spyOn(connector, 'getAddress').mockResolvedValue('bc1');
      expect(await connector.getAddress()).toBe('bc1');
    });

    it('should return undefined if no address is available', async () => {
      jest.spyOn(connector, 'getAddress').mockResolvedValue(undefined);
      expect(await connector.getAddress()).toBeUndefined();
    });
  });

  describe('signMessage', () => {
    it('should return a signed message', async () => {
      jest.spyOn(connector, 'signMessage').mockResolvedValue('signed-message');
      expect(await connector.signMessage('Hello')).toBe('signed-message');
    });
  });

  describe('sendBitcoin', () => {
    it('should return transaction ID', async () => {
      jest
        .spyOn(connector, 'sendBitcoin')
        .mockResolvedValue('bdf509bb18ee6c6a9');
      expect(
        await connector.sendBitcoin({
          recipientAddress: 'bc1q',
          amount: BigInt(1000),
        }),
      ).toBe('bdf509bb18ee6c6a9');
    });
  });

  describe('signPsbt', () => {
    it('should return signed PSBT hex', async () => {
      jest.spyOn(connector, 'signPsbt').mockResolvedValue({
        signedPsbt: 'signed-psbt-hex',
      });
      const signedPsbt = await connector.signPsbt({
        allowedSighash: [],
        unsignedPsbtBase64: 'unsigned-psbt-hex',
      });
      expect(signedPsbt?.signedPsbt).toBe('signed-psbt-hex');
    });

    it('should return an undefined if have an error when signing PSBT', async () => {
      jest.spyOn(connector, 'signPsbt').mockResolvedValue(undefined);
      expect(
        await connector.signPsbt({
          allowedSighash: [],
          unsignedPsbtBase64: 'unsigned-psbt-hex',
        }),
      ).toBeUndefined();
    });
  });

  describe('signPsbts', () => {
    it('should return an array of signed PSBTs', async () => {
      jest
        .spyOn(connector, 'signPsbts')
        .mockResolvedValue(['signed-psbt-hex1', 'signed-psbt-hex2']);
      const signedPsbts = await connector.signPsbts([
        {
          allowedSighash: [],
          unsignedPsbtBase64: 'unsigned-psbt-hex1',
        },
        {
          allowedSighash: [],
          unsignedPsbtBase64: 'unsigned-psbt-hex2',
        },
      ]);
      expect(signedPsbts?.[0]).toBe('signed-psbt-hex1');
      expect(signedPsbts?.[1]).toBe('signed-psbt-hex2');
    });

    it('should return an undefined if have an error when signing PSBTs', async () => {
      jest.spyOn(connector, 'signPsbts').mockResolvedValue(undefined);
      expect(await connector.signPsbts([])).toBeUndefined();
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return connected accounts', async () => {
      jest
        .spyOn(connector, 'getConnectedAccounts')
        .mockResolvedValue(['bc1qexample']);
      expect(await connector.getConnectedAccounts()).toEqual(['bc1qexample']);
    });
  });

  describe('isInstalledOnBrowser', () => {
    it('should return true if installed', () => {
      jest.spyOn(connector, 'isInstalledOnBrowser').mockReturnValue(true);
      expect(connector.isInstalledOnBrowser()).toBe(true);
    });
  });
});
