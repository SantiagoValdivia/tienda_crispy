// scripts/encrypt-credentials.js
// -----------------------------------------------------------------------
// Cifra el usuario y la contraseña reales de Oracle para que puedas
// pegarlos en .env como ORACLE_USER_ENC y ORACLE_PASSWORD_ENC, en vez de
// dejarlos en texto plano.
//
// Requisito previo: tener ENCRYPTION_KEY definida en .env
// (generala primero con: node scripts/generate-key.js)
//
// Uso:
//   node scripts/encrypt-credentials.js <usuario> <password>
//
// Ejemplo:
//   node scripts/encrypt-credentials.js system MiPasswordReal123
// -----------------------------------------------------------------------
require("dotenv").config();
const { encrypt } = require("../src/utils/crypto");

const [, , user, password] = process.argv;

if (!user || !password) {
  console.error("\nUso: node scripts/encrypt-credentials.js <usuario> <password>\n");
  process.exit(1);
}

try {
  const userEnc = encrypt(user);
  const passwordEnc = encrypt(password);

  console.log("\nCredenciales cifradas. Copia estas 2 lineas en tu backend/.env");
  console.log("(y borra/comenta las variables ORACLE_USER / ORACLE_PASSWORD en texto plano):\n");
  console.log(`ORACLE_USER_ENC=${userEnc}`);
  console.log(`ORACLE_PASSWORD_ENC=${passwordEnc}\n`);
} catch (error) {
  console.error("\nError al cifrar:", error.message, "\n");
  process.exit(1);
}
