// scripts/generate-key.js
// -----------------------------------------------------------------------
// Genera una clave maestra de 32 bytes (256 bits) en hexadecimal.
// Se ejecuta UNA sola vez y el resultado se pega en .env como ENCRYPTION_KEY.
//
// Uso:
//   node scripts/generate-key.js
// -----------------------------------------------------------------------
const crypto = require("crypto");

const key = crypto.randomBytes(32).toString("hex");

console.log("\nENCRYPTION_KEY generada. Copiala en tu backend/.env :\n");
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log("Importante: no la subas a git, y usa una clave DIFERENTE en cada entorno (dev/prod).\n");
