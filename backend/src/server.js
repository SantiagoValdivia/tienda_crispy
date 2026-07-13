// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { initPool, closePool } = require("./db/oracle");
const { initGcpClients } = require("./services/gcpService");
const movimientosRoutes = require("./routes/movimientos");
const authRoutes = require("./routes/auth");
const { ARCHITECTURE } = require("./config/architecture");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Todas las rutas de negocio bajo /api
app.use("/api", movimientosRoutes);
app.use("/api", authRoutes);

// Endpoint simple para verificar que el servidor está vivo
// (incluye la arquitectura del sistema: ver ARCHITECTURE.md)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    arquitectura: ARCHITECTURE.tipo,
  });
});

async function start() {
  try {
    await initPool(); // conecta a Oracle XE antes de aceptar peticiones
    initGcpClients(); // inicializa GCP (real o simulado, según .env)

    app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`  Arquitectura: ${ARCHITECTURE.tipo} (ver ARCHITECTURE.md)`);
      console.log(`  Backend escuchando en http://localhost:${PORT}`);
      console.log(`  Endpoints disponibles:`);
      console.log(`    GET  /api/health`);
      console.log(`    GET  /api/stock`);
      console.log(`    GET  /api/usuarios`);
      console.log(`    GET  /api/movimientos`);
      console.log(`    POST /api/movimientos`);
      console.log(`    POST /api/auth/register`);
      console.log(`    POST /api/auth/login`);
      console.log(`=================================================\n`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

// Cierre limpio del pool de Oracle al detener el proceso (Ctrl+C)
process.on("SIGINT", async () => {
  console.log("\nCerrando servidor...");
  await closePool();
  process.exit(0);
});

start();
