const crypto = require("crypto");

/**
 * Field-level encryption for highly sensitive values (SSN).
 * AES-256-GCM, key from BHI_ENCRYPTION_KEY (64 hex chars = 32 bytes).
 *   Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Stored format: v1:<iv b64>:<tag b64>:<ciphertext b64>
 */
const getKey = () => {
  const hex = process.env.BHI_ENCRYPTION_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("BHI_ENCRYPTION_KEY must be set to 64 hex characters (32 bytes).");
  }
  return Buffer.from(hex, "hex");
};

const encrypt = (plain) => {
  if (plain === undefined || plain === null || plain === "") return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
};

const decrypt = (stored) => {
  if (!stored) return "";
  const [version, ivB64, tagB64, dataB64] = String(stored).split(":");
  if (version !== "v1") throw new Error("Unknown encryption format.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
};

/** Normalises "123-45-6789" / "123 45 6789" → "123456789"; returns "" if not 9 digits. */
const normalizeSsn = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 9 ? digits : "";
};

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("hex");

/** Constant-time compare of a raw token against a stored sha256 hash. */
const tokenMatches = (raw, storedHash) => {
  if (!raw || !storedHash) return false;
  const a = Buffer.from(hashToken(raw), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { encrypt, decrypt, normalizeSsn, hashToken, newToken, tokenMatches };
