import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Supabase otherwise falls back to Math.random / a plain PKCE challenge on Hermes.
// Supply only the native WebCrypto operations used by auth-js, preserving existing ones.
export function ensurePkceCrypto() {
  if (Platform.OS !== 'web') {
    const target = globalThis as unknown as {
      crypto?: { getRandomValues?: globalThis.Crypto['getRandomValues']; subtle?: SubtleCrypto };
    };
    target.crypto ??= {};
    target.crypto.getRandomValues ??=
      Crypto.getRandomValues as globalThis.Crypto['getRandomValues'];
    target.crypto.subtle ??= {
      async digest(algorithm: AlgorithmIdentifier, data: BufferSource) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name !== 'SHA-256') throw new Error('Algorithme non pris en charge.');
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
      },
    } as SubtleCrypto;
  }
  if (
    !globalThis.crypto?.getRandomValues ||
    !globalThis.crypto?.subtle?.digest ||
    typeof TextEncoder === 'undefined'
  )
    throw new Error(
      'La connexion sécurisée est indisponible ici. Sur le web, utilisez HTTPS ou localhost.',
    );
}
