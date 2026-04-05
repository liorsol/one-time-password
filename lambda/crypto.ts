import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const DIGEST = "sha256";

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export function generatePassword(): string {
  const length = crypto.randomInt(8, 15); // 8-14 inclusive
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
}

export interface EncryptResult {
  encryptedText: string; // base64
  iv: string;            // base64
  salt: string;          // base64
}

export function encrypt(plaintext: string, password: string): EncryptResult {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedText: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
  };
}

export function decrypt(
  encryptedText: string,
  iv: string,
  salt: string,
  password: string
): string {
  const encryptedBuffer = Buffer.from(encryptedText, "base64");
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

  const key = deriveKey(password, Buffer.from(salt, "base64"));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
