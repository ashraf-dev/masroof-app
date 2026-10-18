import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'masroofy.pin';

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hash(pin: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin() {
  return !!(await SecureStore.getItemAsync(PIN_KEY));
}

export async function setPin(pin: string) {
  const salt = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(PIN_KEY, `${salt}:${await hash(pin, salt)}`);
}

export async function clearPin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function verifyPin(pin: string) {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  const [salt, expected] = stored.split(':');
  return (await hash(pin, salt)) === expected;
}

export async function biometricAvailable() {
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function authenticateBiometric(prompt: string, cancelLabel: string) {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel,
    disableDeviceFallback: true,
  });
  return res.success;
}
