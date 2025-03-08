// Mock implementation of @simplewebauthn/browser
module.exports = {
  WebAuthnAbortService: jest.fn(),
  WebAuthnError: jest.fn(),
  base64URLStringToBuffer: jest.fn(),
  browserSupportsWebAuthn: jest.fn(() => true),
  browserSupportsWebAuthnAutofill: jest.fn(() => true),
  bufferToBase64URLString: jest.fn(),
  platformAuthenticatorIsAvailable: jest.fn(() => Promise.resolve(true)),
  startAuthentication: jest.fn(() => Promise.resolve({})),
  startRegistration: jest.fn(() => Promise.resolve({})),
};
