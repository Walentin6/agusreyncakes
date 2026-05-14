// Password hashing and verification using PBKDF2 (Web Crypto API)
// Format: pbkdf2:iterations:salt:hash (all base64url encoded)

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hash = new Uint8Array(derivedBits);
  return `pbkdf2:${ITERATIONS}:${bufToBase64(salt)}:${bufToBase64(hash)}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    throw new Error('Invalid hash format');
  }

  const iterations = parseInt(parts[1], 10);
  const salt = new Uint8Array(base64ToBuf(parts[2]));
  const expectedHash = new Uint8Array(base64ToBuf(parts[3]));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const actualHash = new Uint8Array(derivedBits);
  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  for (let i = 0; i < actualHash.length; i++) {
    if (actualHash[i] !== expectedHash[i]) {
      return false;
    }
  }

  return true;
}
