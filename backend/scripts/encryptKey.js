// encryptGeminiKey.js
const crypto = require("crypto");

// === CONFIGURE HERE ===
const geminiApiKey = ""; // your plaintext key
const secret = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"; // same as ENCRYPTION_SECRET in your .env
// =======================

const algorithm = "aes-256-gcm";

const encrypt = (text, secret) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret, "hex"), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
};

// Validate secret
if (!secret || secret.length !== 64) {
  console.error("❌ ENCRYPTION_SECRET must be a 64-character hex string");
  process.exit(1);
}

// Encrypt and print result
const encrypted = encrypt(geminiApiKey, secret);
console.log("\n✅ Encrypted Gemini API key:\n");
console.log(encrypted);
console.log("\n⚠️ Copy this value into your MongoDB document under 'geminiApiKey'.\n");
