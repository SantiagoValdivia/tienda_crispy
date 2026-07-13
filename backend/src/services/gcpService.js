// src/services/gcpService.js
// -----------------------------------------------------------------------
// Capa de comunicación con Google Cloud (Pub/Sub + FCM).
//
// MODO SIMULADO (GCP_ENABLED=false en .env):
//   No se conecta a ningún servicio real. Solo imprime en consola lo que
//   HUBIERA enviado. Esto te permite probar todo el flujo del Backend y
//   Oracle sin necesitar todavía una cuenta de Google Cloud.
//
// MODO REAL (GCP_ENABLED=true):
//   Publica de verdad en Pub/Sub y envía notificaciones FCM. Requiere:
//   1) Un proyecto GCP con Pub/Sub y Firebase habilitados.
//   2) Un archivo de credenciales de cuenta de servicio (JSON).
//   3) Las variables GCP_PROJECT_ID, GCP_PUBSUB_TOPIC y
//      GOOGLE_APPLICATION_CREDENTIALS correctamente configuradas en .env.
// -----------------------------------------------------------------------

const GCP_ENABLED = process.env.GCP_ENABLED === "true";

let pubsubClient = null;
let firebaseAdmin = null;

function initGcpClients() {
  if (!GCP_ENABLED) {
    console.log("[GCP] Modo SIMULADO activo (GCP_ENABLED=false). No se conecta a servicios reales.");
    return;
  }

  // Estos requires están aquí adentro a propósito: si GCP_ENABLED es false,
  // ni siquiera se intentan cargar las librerías de Google.
  const { PubSub } = require("@google-cloud/pubsub");
  const admin = require("firebase-admin");

  pubsubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  firebaseAdmin = admin;

  console.log("[GCP] Clientes de Pub/Sub y Firebase Admin inicializados (modo REAL).");
}

/**
 * Publica un evento de "movimiento registrado" en Pub/Sub.
 * En modo simulado, solo loguea el payload.
 */
async function publicarEventoMovimiento(payload) {
  if (!GCP_ENABLED) {
    console.log("[GCP][SIMULADO] Se habria publicado en Pub/Sub:", JSON.stringify(payload));
    return { simulado: true };
  }

  const topic = pubsubClient.topic(process.env.GCP_PUBSUB_TOPIC);
  const dataBuffer = Buffer.from(JSON.stringify(payload));
  const messageId = await topic.publishMessage({ data: dataBuffer });
  console.log(`[GCP] Mensaje publicado en Pub/Sub, id=${messageId}`);
  return { simulado: false, messageId };
}

/**
 * Envía una notificación push FCM a un token de dispositivo específico.
 * En modo simulado, solo loguea lo que se hubiera enviado.
 */
async function enviarNotificacionFCM(fcmToken, titulo, cuerpo) {
  if (!GCP_ENABLED) {
    console.log(`[GCP][SIMULADO] Se habria enviado FCM a token=${fcmToken}: "${titulo}" - "${cuerpo}"`);
    return { simulado: true };
  }

  if (!fcmToken) {
    console.warn("[GCP] No se envio FCM: el usuario no tiene token registrado.");
    return { simulado: false, enviado: false };
  }

  const message = {
    token: fcmToken,
    notification: { title: titulo, body: cuerpo },
  };

  const response = await firebaseAdmin.messaging().send(message);
  console.log("[GCP] Notificacion FCM enviada:", response);
  return { simulado: false, enviado: true, response };
}

module.exports = {
  initGcpClients,
  publicarEventoMovimiento,
  enviarNotificacionFCM,
  GCP_ENABLED,
};
