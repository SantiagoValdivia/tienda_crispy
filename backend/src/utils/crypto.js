// src/utils/crypto.js
// -----------------------------------------------------------------------
// Cifrado simetrico (AES-256-GCM) para NO guardar usuario/contraseña de
// Oracle en texto plano dentro de .env.
//
// Como funciona:
//   1) ENCRYPTION_KEY (en .env) es una clave maestra de 32 bytes en hex.
//      Esta clave NUNCA cifra datos de negocio, solo protege las
//      credenciales de conexion (ORACLE_USER_ENC / ORACLE_PASSWORD_ENC).
//   2) encrypt(texto) -> devuelve "iv:authTag:cipherText" (todo en hex),
//      listo para pegar en .env.
//   3) decrypt(valorCifrado) -> devuelve el texto original en memoria,
//      usado una sola vez al levantar el pool de Oracle.
//
// GCM se eligio sobre CBC porque incluye un "authTag": si alguien altera
// el valor cifrado en el .env, decrypt() falla en vez de devolver basura.
// -----------------------------------------------------------------------
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "Falta ENCRYPTION_KEY en .env. Generala con: node scripts/generate-key.js"
    );
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY debe ser una cadena hex de 32 bytes (64 caracteres).");
  }
  return key;
}

function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decrypt(encryptedValue) {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = String(encryptedValue).split(":");

  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Valor cifrado con formato invalido (se esperaba iv:authTag:data).");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
