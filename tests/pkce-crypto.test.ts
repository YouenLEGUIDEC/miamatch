import { test, expect, jest } from '@jest/globals';
import { ensurePkceCrypto } from '../src/data/pkceCrypto';
jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint32Array) => require('node:crypto').webcrypto.getRandomValues(array),
  digest: (_algorithm: string, data: BufferSource) =>
    require('node:crypto').webcrypto.subtle.digest('SHA-256', data),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
test('Hermes adapter provides secure randomness and the RFC 7636 S256 challenge', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: undefined,
    writable: true,
    configurable: true,
  });
  try {
    ensurePkceCrypto();
    expect(Array.from(crypto.getRandomValues(new Uint32Array(4))).some(Boolean)).toBe(true);
    const result = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    );
    expect(Buffer.from(result).toString('base64url')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
    else Reflect.deleteProperty(globalThis, 'crypto');
  }
});
