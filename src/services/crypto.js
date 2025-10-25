/**
 * Servicio de cifrado local usando Web Crypto API
 * Cifra datos sensibles como tokens JWT para almacenamiento seguro
 */

const SALT_KEY = 'facenomad-salt';
const STORAGE_KEY = 'facenomad-key';

async function getEncryptionKey() {
  let storedKey = localStorage.getItem(STORAGE_KEY);
  
  if (!storedKey) {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exported = await crypto.subtle.exportKey("jwk", key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exported));
    return key;
  }
  
  const keyData = JSON.parse(storedKey);
  return crypto.subtle.importKey(
    "jwk",
    keyData,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(plaintext) {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(JSON.stringify(plaintext))
    );
    
    return {
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      iv: Array.from(iv)
    };
  } catch (error) {
    console.error('Error al cifrar datos:', error);
    throw error;
  }
}

export async function decryptData(encrypted) {
  try {
    const key = await getEncryptionKey();
    const decoder = new TextDecoder();
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encrypted.iv) },
      key,
      new Uint8Array(encrypted.ciphertext)
    );
    
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Error al descifrar datos:', error);
    return null;
  }
}

export function clearEncryptionKey() {
  localStorage.removeItem(STORAGE_KEY);
}
