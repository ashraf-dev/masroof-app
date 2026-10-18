import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

/**
 * AsyncStorage wrapper that AES-256 encrypts every value. The key lives in the
 * platform keystore (Keychain / Android Keystore) via expo-secure-store, so the
 * data at rest is unreadable without the device's secure hardware.
 */
const KEY_NAME = 'masroofy.storage-key';
let keyPromise: Promise<CryptoJS.lib.WordArray> | null = null;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getKey() {
  if (!keyPromise) {
    keyPromise = (async () => {
      let hex = await SecureStore.getItemAsync(KEY_NAME);
      if (!hex) {
        hex = toHex(Crypto.getRandomBytes(32));
        await SecureStore.setItemAsync(KEY_NAME, hex);
      }
      return CryptoJS.enc.Hex.parse(hex);
    })();
  }
  return keyPromise;
}

async function encrypt(plain: string) {
  const key = await getKey();
  const iv = CryptoJS.enc.Hex.parse(toHex(Crypto.getRandomBytes(16)));
  const cipher = CryptoJS.AES.encrypt(plain, key, { iv });
  return `${iv.toString(CryptoJS.enc.Hex)}:${cipher.toString()}`;
}

async function decrypt(stored: string) {
  const sep = stored.indexOf(':');
  if (sep !== 32) return null;
  const key = await getKey();
  const iv = CryptoJS.enc.Hex.parse(stored.slice(0, sep));
  const plain = CryptoJS.AES.decrypt(stored.slice(sep + 1), key, { iv }).toString(CryptoJS.enc.Utf8);
  return plain || null;
}

export const encryptedStorage = {
  async getItem(name: string): Promise<string | null> {
    const raw = await AsyncStorage.getItem(name);
    if (raw == null) return null;
    try {
      return await decrypt(raw);
    } catch {
      return null;
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    await AsyncStorage.setItem(name, await encrypt(value));
  },
  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(name);
  },
};

/**
 * Coalesces rapid writes of the same key (zustand persists on every state
 * change) so we encrypt and write at most once per `delay` ms.
 */
export function debouncedStorage(delay = 300) {
  const pending = new Map<string, { value: string; timer: ReturnType<typeof setTimeout> }>();
  return {
    getItem: (name: string) => {
      const p = pending.get(name);
      return p ? Promise.resolve(p.value) : encryptedStorage.getItem(name);
    },
    setItem: (name: string, value: string) => {
      const existing = pending.get(name);
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => {
        pending.delete(name);
        encryptedStorage.setItem(name, value).catch(() => {});
      }, delay);
      pending.set(name, { value, timer });
    },
    removeItem: (name: string) => {
      const existing = pending.get(name);
      if (existing) clearTimeout(existing.timer);
      pending.delete(name);
      return encryptedStorage.removeItem(name);
    },
  };
}
