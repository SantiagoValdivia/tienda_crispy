// src/routes/movimientos.js
const express = require("express");
const router = express.Router();
const {
  registrarMovimiento,
  listarStock,
  listarMovimientos,
  listarUsuarios,
} = require("../services/movimientosService");

// POST /api/movimientos  -> registra un movimiento (entrada/salida) de stock
router.post("/movimientos", async (req, res) => {
  const { stockId, usuarioId, tipo, cantidad, rol } = req.body;

  if (!stockId || !tipo || !cantidad || !rol) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: stockId, tipo, cantidad, rol",
    });
  }
  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return res.status(400).json({ error: "tipo debe ser 'ENTRADA' o 'SALIDA'" });
  }

  try {
    const resultado = await registrarMovimiento({
      stockId: Number(stockId),
      usuarioId: usuarioId ? Number(usuarioId) : null,
      tipo,
      cantidad: Number(cantidad),
      rol,
    });
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Error en POST /movimientos:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/movimientos -> historial de movimientos
router.get("/movimientos", async (req, res) => {
  try {
    const data = await listarMovimientos();
    res.json(data);
  } catch (error) {
    console.error("Error en GET /movimientos:", error.message);
    res.status(500).json({ error: "Error al consultar movimientos" });
  }
});

// GET /api/stock -> inventario actual
router.get("/stock", async (req, res) => {
  try {
    const data = await listarStock();
    res.json(data);
  } catch (error) {
    console.error("Error en GET /stock:", error.message);
    res.status(500).json({ error: "Error al consultar stock" });
  }
});

// GET /api/usuarios -> lista de usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const data = await listarUsuarios();
    res.json(data);
  } catch (error) {
    console.error("Error en GET /usuarios:", error.message);
    res.status(500).json({ error: "Error al consultar usuarios" });
  }
});

module.exports = router;
