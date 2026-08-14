import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * AES-256-GCM helpers for OAuth refresh tokens at rest. The 32-byte hex key
 * is passed in by the caller (each app reads it from its own validated env)
 * rather than read from process.env here, so this package stays free of
 * any single app's environment schema.
 */
export function encryptSecret(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(payload: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
