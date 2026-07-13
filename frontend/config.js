// =====================================================================
// frontend/config.js
// ---------------------------------------------------------------------
// UNICO lugar donde se define el PUERTO / URL del backend.
// Si cambias de "localhost" a un servidor real (Render, Railway, etc.)
// SOLO tienes que tocar esta línea, ningún otro archivo.
//
// Este archivo lo usan:
//   - frontend/index.html                (login)
//   - frontend/mezclados.html             (panel combinado)
//   - frontend/panel-administrador.html
//   - frontend/panel-distribuidor.html
//   - frontend/panel-vendedor.html
// a través de frontend/js/api.js
// =====================================================================

const APP_CONFIG = {
  // --- EL PUERTO ---
  // Debe coincidir con PORT en backend/.env (por defecto 8080).
  BACKEND_PORT: 8080,

  // Host donde corre el backend. En local es localhost.
  // Cuando subas el backend a la nube (Render/Railway/Cloud Run),
  // cambia esto por ejemplo a: "https://mi-backend.onrender.com"
  BACKEND_HOST: "http://localhost",

  // URL completa que arma automáticamente host + puerto + /api.
  // No la edites directamente: cambia BACKEND_HOST / BACKEND_PORT arriba.
  get API_BASE_URL() {
    // Si BACKEND_HOST ya trae protocolo (nube), no le pegamos el puerto.
    if (this.BACKEND_HOST.includes("localhost") || this.BACKEND_HOST.includes("127.0.0.1")) {
      return `${this.BACKEND_HOST}:${this.BACKEND_PORT}/api`;
    }
    return `${this.BACKEND_HOST}/api`;
  },
};
