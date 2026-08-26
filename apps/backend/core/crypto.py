"""AES-256-GCM port of packages/server/src/crypto/encryption.ts — byte-compatible
with the Node implementation (same key derivation, same iv[12]+tag[16]+ciphertext
layout, base64-encoded), so a token encrypted by the Node API decrypts correctly
here, and a token encrypted here decrypts correctly in Node. That compatibility
is what lets both stacks read/write the same encrypted fields (OAuth refresh
tokens today) side by side during the migration — verified with a cross-language
round-trip test, not assumed.
"""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

IV_LENGTH = 12
TAG_LENGTH = 16
KEY_LENGTH = 32


def _load_key(hex_key: str) -> bytes:
    key = bytes.fromhex(hex_key)
    if len(key) != KEY_LENGTH:
        raise ValueError(f"Encryption key must be {KEY_LENGTH} bytes ({KEY_LENGTH * 2} hex characters)")
    return key


def encrypt_secret(plaintext: str, hex_key: str) -> str:
    key = _load_key(hex_key)
    iv = os.urandom(IV_LENGTH)
    # cryptography's AESGCM.encrypt returns ciphertext with the 16-byte tag
    # appended at the end; Node's Buffer.concat([iv, authTag, ciphertext])
    # puts the tag *before* the ciphertext, so the two have to be split and
    # reordered to produce an identical payload.
    sealed = AESGCM(key).encrypt(iv, plaintext.encode("utf-8"), None)
    ciphertext, tag = sealed[:-TAG_LENGTH], sealed[-TAG_LENGTH:]
    return base64.b64encode(iv + tag + ciphertext).decode("ascii")


def decrypt_secret(payload: str, hex_key: str) -> str:
    key = _load_key(hex_key)
    raw = base64.b64decode(payload)
    iv = raw[:IV_LENGTH]
    tag = raw[IV_LENGTH : IV_LENGTH + TAG_LENGTH]
    ciphertext = raw[IV_LENGTH + TAG_LENGTH :]
    # Reassemble into the ciphertext+tag order AESGCM.decrypt expects.
    plaintext = AESGCM(key).decrypt(iv, ciphertext + tag, None)
    return plaintext.decode("utf-8")
