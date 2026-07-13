// src/routes/auth.js
const express = require("express");
const router = express.Router();
const { registrarUsuario, loginUsuario } = require("../services/authService");

const ROLES_VALIDOS = ["ADMINISTRADOR", "DISTRIBUIDOR", "VENDEDOR"];

// POST /api/auth/register -> crea un usuario con contraseña cifrada (hash bcrypt)
router.post("/auth/register", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan campos: nombre, email, password, rol" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ error: `rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}` });
  }

  try {
    const usuario = await registrarUsuario({ nombre, email, password, rol });
    res.status(201).json({ usuario });
  } catch (error) {
    console.error("Error en POST /auth/register:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login -> valida credenciales y devuelve un JWT
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos: email, password" });
  }

  try {
    const { token, usuario } = await loginUsuario({ email, password });
    res.json({ token, usuario });
  } catch (error) {
    // Mensaje generico a proposito: no revelar si el email existe o no
    res.status(401).json({ error: "Credenciales invalidas." });
  }
});

module.exports = router;
