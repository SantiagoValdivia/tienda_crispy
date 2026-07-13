// src/db/oracle.js
// -----------------------------------------------------------------------
// Maneja un pool de conexiones a Oracle XE. Un pool es más eficiente que
// abrir/cerrar una conexión nueva en cada petición HTTP.
// -----------------------------------------------------------------------
const oracledb = require("oracledb");
const { decrypt } = require("../utils/crypto");

// Hace que las consultas devuelvan objetos { COLUMNA: valor } en vez de arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false; // controlamos el commit manualmente en cada transacción

let pool;

// -----------------------------------------------------------------------
// Resuelve el usuario/contraseña reales de Oracle.
// Prioridad: variables cifradas (ORACLE_USER_ENC / ORACLE_PASSWORD_ENC).
// Si no existen, cae a las variables en texto plano (solo para desarrollo
// rapido local) e imprime una advertencia.
// -----------------------------------------------------------------------
function resolveOracleCredentials() {
  const { ORACLE_USER_ENC, ORACLE_PASSWORD_ENC, ORACLE_USER, ORACLE_PASSWORD } = process.env;

  if (ORACLE_USER_ENC && ORACLE_PASSWORD_ENC) {
    return {
      user: decrypt(ORACLE_USER_ENC),
      password: decrypt(ORACLE_PASSWORD_ENC),
    };
  }

  console.warn(
    "[Oracle][ADVERTENCIA] Estas usando ORACLE_USER/ORACLE_PASSWORD en texto plano. " +
      "Genera credenciales cifradas con: node scripts/encrypt-credentials.js <usuario> <password>"
  );
  return { user: ORACLE_USER, password: ORACLE_PASSWORD };
}

async function initPool() {
  if (pool) return pool;

  const { user, password } = resolveOracleCredentials();

  pool = await oracledb.createPool({
    user,
    password,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });

  console.log("[Oracle] Pool de conexiones inicializado correctamente (credenciales descifradas en memoria).");
  return pool;
}

async function getConnection() {
  if (!pool) await initPool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(10); // espera hasta 10s a que terminen conexiones activas
    console.log("[Oracle] Pool cerrado.");
  }
}

module.exports = { initPool, getConnection, closePool };
