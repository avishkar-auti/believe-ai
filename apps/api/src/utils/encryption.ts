import { decryptSecret as sharedDecrypt, encryptSecret as sharedEncrypt } from "@believe-ai/server";
import { env } from "../config/env.js";

export function encryptSecret(plaintext: string): string {
  return sharedEncrypt(plaintext, env.ENCRYPTION_KEY);
}

export function decryptSecret(payload: string): string {
  return sharedDecrypt(payload, env.ENCRYPTION_KEY);
}
