import { createHash, createHmac, createSecretKey, randomBytes, timingSafeEqual, } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
const TOKEN_VERSION = "cxh1";
const MAC_DOMAIN = Buffer.from("cx-framework:hmac-token:v1\0", "ascii");
const MAX_KEY_COUNT = 16;
const MAX_KEY_ID_CHARACTERS = 64;
const MIN_SECRET_BYTES = 32;
const MAX_SECRET_BYTES = 4_096;
const DEFAULT_MAX_PAYLOAD_BYTES = 4_096;
const MAX_PAYLOAD_BYTES = 65_536;
const MAX_HASH_INPUT_BYTES = 16 * 1_024 * 1_024;
const MIN_RANDOM_IDENTIFIER_BYTES = 16;
const DEFAULT_RANDOM_IDENTIFIER_BYTES = 32;
const MAX_RANDOM_IDENTIFIER_BYTES = 64;
const SHA_256_BYTES = 32;
const SHA_256_BASE64URL_CHARACTERS = 43;
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const PURPOSE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
/** Return the canonical lowercase SHA-256 fingerprint of a bounded byte or UTF-8 value. */
export function sha256Hex(value, { maxInputBytes = MAX_HASH_INPUT_BYTES } = {}) {
    if (!Number.isSafeInteger(maxInputBytes) ||
        maxInputBytes < 1 ||
        maxInputBytes > MAX_HASH_INPUT_BYTES) {
        throw new Error(`SHA-256 maxInputBytes must be between 1 and ${MAX_HASH_INPUT_BYTES}.`);
    }
    if (typeof value === "string") {
        assertWellFormedUtf16(value, "SHA-256 string inputs");
        if (Buffer.byteLength(value, "utf8") > maxInputBytes) {
            throw new Error(`SHA-256 input cannot exceed ${maxInputBytes} UTF-8 bytes.`);
        }
        return createHash("sha256").update(value, "utf8").digest("hex");
    }
    if (!(value instanceof Uint8Array)) {
        throw new TypeError("SHA-256 input must be a string or Uint8Array value.");
    }
    if (value.byteLength > maxInputBytes) {
        throw new Error(`SHA-256 input cannot exceed ${maxInputBytes} bytes.`);
    }
    return createHash("sha256").update(Buffer.from(value)).digest("hex");
}
/** Generate a cryptographically strong, cookie-safe identifier with a deliberate size bound. */
export function randomBase64UrlIdentifier(byteLength = DEFAULT_RANDOM_IDENTIFIER_BYTES) {
    if (!Number.isSafeInteger(byteLength) ||
        byteLength < MIN_RANDOM_IDENTIFIER_BYTES ||
        byteLength > MAX_RANDOM_IDENTIFIER_BYTES) {
        throw new Error(`Random identifier byteLength must be between ${MIN_RANDOM_IDENTIFIER_BYTES} and ${MAX_RANDOM_IDENTIFIER_BYTES}.`);
    }
    return randomBytes(byteLength).toString("base64url");
}
/**
 * Create a compact, versioned HMAC-SHA-256 token codec.
 *
 * Tokens are authenticated, not encrypted. The purpose is included in the MAC rather than the
 * token so two features cannot accept each other's tokens even if they share key material.
 */
export function createHmacTokenCodec({ activeKeyId, keys, maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES, purpose, }) {
    const safePurpose = validatePurpose(purpose);
    const safeMaxPayloadBytes = validateMaxPayloadBytes(maxPayloadBytes);
    const keyring = createKeyring(keys);
    const safeActiveKeyId = validateKeyId(activeKeyId);
    const activeKey = keyring.get(safeActiveKeyId);
    if (!activeKey) {
        throw new Error("The active HMAC key ID is not present in the keyring.");
    }
    const activeSigningKey = activeKey;
    const purposeBytes = Buffer.from(safePurpose, "ascii");
    const purposeLength = Buffer.allocUnsafe(4);
    purposeLength.writeUInt32BE(purposeBytes.length);
    const maximumTokenCharacters = TOKEN_VERSION.length +
        1 +
        MAX_KEY_ID_CHARACTERS +
        1 +
        base64UrlCharacterCount(safeMaxPayloadBytes) +
        1 +
        SHA_256_BASE64URL_CHARACTERS;
    function signature(key, core) {
        return createHmac("sha256", key)
            .update(MAC_DOMAIN)
            .update(purposeLength)
            .update(purposeBytes)
            .update("\0", "ascii")
            .update(core, "ascii")
            .digest();
    }
    function sign(payload) {
        if (!(payload instanceof Uint8Array)) {
            throw new TypeError("HMAC token payloads must be Uint8Array values.");
        }
        if (payload.byteLength > safeMaxPayloadBytes) {
            throw new Error(`HMAC token payloads cannot exceed ${safeMaxPayloadBytes} bytes.`);
        }
        const payloadBytes = Buffer.from(payload);
        const encodedPayload = payloadBytes.toString("base64url");
        const core = `${TOKEN_VERSION}.${safeActiveKeyId}.${encodedPayload}`;
        const encodedSignature = signature(activeSigningKey, core).toString("base64url");
        return `${core}.${encodedSignature}`;
    }
    function verify(token) {
        if (typeof token !== "string" ||
            token.length === 0 ||
            token.length > maximumTokenCharacters) {
            return null;
        }
        const parts = token.split(".");
        if (parts.length !== 4)
            return null;
        const [version, keyId, encodedPayload, encodedSignature] = parts;
        if (version !== TOKEN_VERSION ||
            !keyId ||
            !KEY_ID_PATTERN.test(keyId) ||
            encodedPayload === undefined ||
            encodedSignature === undefined ||
            encodedSignature.length !== SHA_256_BASE64URL_CHARACTERS) {
            return null;
        }
        const key = keyring.get(keyId);
        if (!key)
            return null;
        const payload = decodeCanonicalBase64Url(encodedPayload, safeMaxPayloadBytes);
        const suppliedSignature = decodeCanonicalBase64Url(encodedSignature, SHA_256_BYTES);
        if (!payload ||
            !suppliedSignature ||
            suppliedSignature.length !== SHA_256_BYTES) {
            return null;
        }
        const core = `${version}.${keyId}.${encodedPayload}`;
        const expectedSignature = signature(key, core);
        if (!timingSafeEqual(suppliedSignature, expectedSignature))
            return null;
        return Object.freeze({
            keyId,
            payload: new Uint8Array(payload),
        });
    }
    function signUtf8(payload) {
        if (typeof payload !== "string") {
            throw new TypeError("HMAC text token payloads must be strings.");
        }
        assertWellFormedUtf16(payload, "HMAC text token payloads");
        if (payload.length > safeMaxPayloadBytes) {
            throw new Error(`HMAC token payloads cannot exceed ${safeMaxPayloadBytes} bytes.`);
        }
        return sign(encoder.encode(payload));
    }
    function verifyUtf8(token) {
        const verified = verify(token);
        if (!verified)
            return null;
        try {
            return Object.freeze({
                keyId: verified.keyId,
                payload: decoder.decode(verified.payload),
            });
        }
        catch {
            return null;
        }
    }
    return Object.freeze({
        activeKeyId: safeActiveKeyId,
        maxPayloadBytes: safeMaxPayloadBytes,
        sign,
        signUtf8,
        verify,
        verifyUtf8,
    });
}
function createKeyring(keys) {
    if (!Array.isArray(keys) ||
        keys.length === 0 ||
        keys.length > MAX_KEY_COUNT) {
        throw new Error(`An HMAC keyring must contain between 1 and ${MAX_KEY_COUNT} keys.`);
    }
    const keyring = new Map();
    for (const candidate of keys) {
        if (!candidate || typeof candidate !== "object") {
            throw new Error("Every HMAC key must provide an ID and secret.");
        }
        const id = validateKeyId(candidate.id);
        if (keyring.has(id))
            throw new Error(`Duplicate HMAC key ID: ${id}.`);
        const bytes = secretBytes(candidate.secret);
        try {
            keyring.set(id, createSecretKey(bytes));
        }
        finally {
            bytes.fill(0);
        }
    }
    return keyring;
}
function secretBytes(secret) {
    let bytes;
    if (typeof secret === "string") {
        assertWellFormedUtf16(secret, "HMAC string secrets");
        if (secret.length > MAX_SECRET_BYTES) {
            throw new Error(`HMAC secrets must contain between ${MIN_SECRET_BYTES} and ${MAX_SECRET_BYTES} bytes.`);
        }
        bytes = Buffer.from(secret, "utf8");
    }
    else if (secret instanceof Uint8Array) {
        if (secret.byteLength > MAX_SECRET_BYTES) {
            throw new Error(`HMAC secrets must contain between ${MIN_SECRET_BYTES} and ${MAX_SECRET_BYTES} bytes.`);
        }
        bytes = Buffer.from(secret);
    }
    else {
        throw new TypeError("HMAC secrets must be strings or Uint8Array values.");
    }
    if (bytes.length < MIN_SECRET_BYTES || bytes.length > MAX_SECRET_BYTES) {
        bytes.fill(0);
        throw new Error(`HMAC secrets must contain between ${MIN_SECRET_BYTES} and ${MAX_SECRET_BYTES} bytes.`);
    }
    return bytes;
}
function assertWellFormedUtf16(value, label) {
    for (let index = 0; index < value.length; index += 1) {
        const codeUnit = value.charCodeAt(index);
        if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
            const nextCodeUnit = value.charCodeAt(index + 1);
            if (index + 1 >= value.length ||
                nextCodeUnit < 0xdc00 ||
                nextCodeUnit > 0xdfff) {
                throw new Error(`${label} must contain well-formed UTF-16.`);
            }
            index += 1;
            continue;
        }
        if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
            throw new Error(`${label} must contain well-formed UTF-16.`);
        }
    }
}
function validateKeyId(value) {
    if (typeof value !== "string" || !KEY_ID_PATTERN.test(value)) {
        throw new Error(`HMAC key IDs must contain 1 to ${MAX_KEY_ID_CHARACTERS} URL-safe characters.`);
    }
    return value;
}
function validatePurpose(value) {
    if (typeof value !== "string" || !PURPOSE_PATTERN.test(value)) {
        throw new Error("HMAC token purposes must contain 1 to 128 safe ASCII characters.");
    }
    return value;
}
function validateMaxPayloadBytes(value) {
    if (!Number.isSafeInteger(value) || value < 1 || value > MAX_PAYLOAD_BYTES) {
        throw new Error(`HMAC maxPayloadBytes must be between 1 and ${MAX_PAYLOAD_BYTES}.`);
    }
    return value;
}
function decodeCanonicalBase64Url(value, maxBytes) {
    if (!BASE64URL_PATTERN.test(value) ||
        value.length > base64UrlCharacterCount(maxBytes)) {
        return null;
    }
    const decoded = Buffer.from(value, "base64url");
    if (decoded.length > maxBytes || decoded.toString("base64url") !== value) {
        decoded.fill(0);
        return null;
    }
    return decoded;
}
function base64UrlCharacterCount(byteCount) {
    return Math.ceil((byteCount * 4) / 3);
}
