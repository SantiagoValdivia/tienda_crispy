// src/services/movimientosService.js
// -----------------------------------------------------------------------
// Aquí vive la regla de negocio central del proyecto:
//
//   1) Oracle guarda el movimiento y actualiza el stock (transacción ACID).
//   2) SOLO si Oracle confirma con éxito, se le avisa a Google Cloud
//      (Pub/Sub) para que distribuya la notificación a quien corresponda.
//
// Si el paso 2 falla, no se revierte el paso 1: Oracle ya es la fuente de
// la verdad y el dato quedó seguro. El error de notificación solo se loguea.
// -----------------------------------------------------------------------
const oracledb = require("oracledb");
const { getConnection } = require("../db/oracle");
const { publicarEventoMovimiento, enviarNotificacionFCM } = require("./gcpService");

async function registrarMovimiento({ stockId, usuarioId, tipo, cantidad, rol }) {
  let connection;

  try {
    connection = await getConnection();

    // --- 1) Verificar que el stock existe y traer su cantidad actual ---
    const stockActual = await connection.execute(
      `SELECT id, producto, cantidad FROM stock WHERE id = :id`,
      { id: stockId }
    );

    if (stockActual.rows.length === 0) {
      throw new Error(`No existe un producto en stock con id=${stockId}`);
    }

    const producto = stockActual.rows[0];
    const cantidadActual = producto.CANTIDAD;
    const nuevaCantidad =
      tipo === "ENTRADA" ? cantidadActual + cantidad : cantidadActual - cantidad;

    if (nuevaCantidad < 0) {
      throw new Error("Stock insuficiente para realizar esta salida.");
    }

    // --- 2) INSERT en movimientos (histórico, fuente de verdad) ---
    await connection.execute(
      `INSERT INTO movimientos (stock_id, usuario_id, tipo, cantidad, rol)
       VALUES (:stockId, :usuarioId, :tipo, :cantidad, :rol)`,
      { stockId, usuarioId, tipo, cantidad, rol }
    );

    // --- 3) UPDATE de stock (sincrono, dentro de la misma transaccion) ---
    await connection.execute(
      `UPDATE stock SET cantidad = :nuevaCantidad, fecha_update = SYSTIMESTAMP WHERE id = :stockId`,
      { nuevaCantidad, stockId }
    );

    // --- 4) Confirmar transaccion en Oracle ---
    await connection.commit();
    console.log(`[Oracle] Movimiento confirmado: producto=${producto.PRODUCTO}, tipo=${tipo}, cantidad=${cantidad}`);

    // --- 5) Avisar a Google Cloud (best-effort, no bloquea ni revierte Oracle) ---
    const eventoPayload = {
      stockId,
      producto: producto.PRODUCTO,
      tipo,
      cantidad,
      nuevaCantidad,
      rol,
      fecha: new Date().toISOString(),
    };

    try {
      await publicarEventoMovimiento(eventoPayload);

      // Notificacion directa al/los administradores (ejemplo simple: a un token fijo o por usuario)
      const admins = await connection.execute(
        `SELECT fcm_token FROM usuarios WHERE rol = 'ADMINISTRADOR' AND fcm_token IS NOT NULL`
      );
      for (const admin of admins.rows) {
        await enviarNotificacionFCM(
          admin.FCM_TOKEN,
          "Stock actualizado",
          `${tipo === "ENTRADA" ? "Entrada" : "Salida"} de ${cantidad} unidades en "${producto.PRODUCTO}".`
        );
      }
    } catch (gcpError) {
      // Importante: un fallo en la notificacion NUNCA debe revertir el dato ya guardado.
      console.error("[GCP] Error al notificar (el movimiento en Oracle SI quedo guardado):", gcpError.message);
    }

    return { success: true, producto: producto.PRODUCTO, nuevaCantidad };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function listarStock() {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`SELECT id, producto, cantidad, unidad FROM stock ORDER BY id`);
    return result.rows;
  } finally {
    await connection.close();
  }
}

async function listarMovimientos() {
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      `SELECT m.id, s.producto, m.tipo, m.cantidad, m.rol, m.fecha
       FROM movimientos m
       JOIN stock s ON s.id = m.stock_id
       ORDER BY m.fecha DESC
       FETCH FIRST 50 ROWS ONLY`
    );
    return result.rows;
  } finally {
    await connection.close();
  }
}

async function listarUsuarios() {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`SELECT id, nombre, email, rol FROM usuarios ORDER BY id`);
    return result.rows;
  } finally {
    await connection.close();
  }
}

module.exports = { registrarMovimiento, listarStock, listarMovimientos, listarUsuarios };
