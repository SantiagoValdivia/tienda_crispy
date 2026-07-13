// src/services/authService.js
// -----------------------------------------------------------------------
// Registro y login de usuarios de la app.
//
// La contraseña NUNCA se guarda ni se compara en texto plano:
//   - Al registrar: bcrypt.hash() genera un hash de un solo sentido
//     (con "salt" incluido) y eso es lo unico que se guarda en Oracle
//     (columna usuarios.password_hash).
//   - Al iniciar sesion: bcrypt.compare() valida la contraseña ingresada
//     contra el hash guardado, sin descifrarlo (bcrypt no es reversible).
//
// Si el login es correcto, se firma un JWT (JSON Web Token) con JWT_SECRET
// para que el frontend lo use en las siguientes peticiones sin reenviar
// la contraseña.
// -----------------------------------------------------------------------
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const oracledb = require("oracledb");
const { getConnection } = require("../db/oracle");

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = "8h";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta JWT_SECRET en .env");
  }
  return secret;
}

async function registrarUsuario({ nombre, email, password, rol }) {
  const connection = await getConnection();
  try {
    const existente = await connection.execute(
      `SELECT id FROM usuarios WHERE email = :email`,
      { email }
    );
    if (existente.rows.length > 0) {
      throw new Error("Ya existe un usuario registrado con ese email.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await connection.execute(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES (:nombre, :email, :passwordHash, :rol)
       RETURNING id INTO :id`,
      {
        nombre,
        email,
        passwordHash,
        rol,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    await connection.commit();
    return { id: result.outBinds.id[0], nombre, email, rol };
  } finally {
    await connection.close();
  }
}

async function loginUsuario({ email, password }) {
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      `SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      throw new Error("Credenciales invalidas.");
    }

    const usuario = result.rows[0];

    if (!usuario.PASSWORD_HASH) {
      throw new Error("Este usuario todavia no tiene contraseña configurada. Usa /api/auth/register.");
    }

    const passwordValida = await bcrypt.compare(password, usuario.PASSWORD_HASH);
    if (!passwordValida) {
      throw new Error("Credenciales invalidas.");
    }

    const token = jwt.sign(
      { id: usuario.ID, email: usuario.EMAIL, rol: usuario.ROL },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: { id: usuario.ID, nombre: usuario.NOMBRE, email: usuario.EMAIL, rol: usuario.ROL },
    };
  } finally {
    await connection.close();
  }
}

module.exports = { registrarUsuario, loginUsuario };
