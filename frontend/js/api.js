// =====================================================================
// frontend/js/api.js
// ---------------------------------------------------------------------
// Funciones compartidas por TODOS los paneles:
//   - login() / logout()
//   - guardar/leer el JWT y el rol del usuario (sesión)
//   - apiFetch() -> fetch ya apuntado al puerto correcto (config.js)
//   - protegerPagina(rolesPermitidos) -> saca al usuario si no tiene sesión
//     o no tiene el rol correcto para ver ese panel
//
// Requiere que config.js se cargue ANTES que este archivo.
// =====================================================================

const SESSION_KEY = "panel_sesion"; // { token, usuario: {id, nombre, email, rol} }

function guardarSesion(token, usuario) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, usuario }));
}

function leerSesion() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

// Redirige al panel correcto según el rol del usuario logueado.
function irAPanelSegunRol(rol) {
  const destinos = {
    ADMINISTRADOR: "panel-administrador.html",
    DISTRIBUIDOR: "panel-distribuidor.html",
    VENDEDOR: "panel-vendedor.html",
  };
  window.location.href = destinos[rol] || "mezclados.html";
}

// Llama esta función al cargar CUALQUIER panel protegido.
// rolesPermitidos: array de roles que pueden ver esa página, ej. ["ADMINISTRADOR"]
// Si no se pasa, solo exige que haya sesión (cualquier rol puede entrar).
function protegerPagina(rolesPermitidos) {
  const sesion = leerSesion();
  if (!sesion) {
    window.location.href = "index.html";
    return null;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(sesion.usuario.rol)) {
    alert("Tu usuario (" + sesion.usuario.rol + ") no tiene acceso a este panel.");
    irAPanelSegunRol(sesion.usuario.rol);
    return null;
  }
  return sesion;
}

// fetch con la URL del backend ya armada (host + PUERTO) y el token
// de sesión incluido automáticamente si existe.
async function apiFetch(ruta, opciones = {}) {
  const sesion = leerSesion();
  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };
  if (sesion && sesion.token) {
    headers["Authorization"] = "Bearer " + sesion.token;
  }

  const respuesta = await fetch(APP_CONFIG.API_BASE_URL + ruta, {
    ...opciones,
    headers,
  });

  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(data.error || "Error al conectar con el backend (puerto " + APP_CONFIG.BACKEND_PORT + ")");
  }
  return data;
}

// Login real contra POST /api/auth/login
async function iniciarSesion(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  guardarSesion(data.token, data.usuario);
  return data.usuario;
}

// Registro real contra POST /api/auth/register
async function registrarUsuario(nombre, email, password, rol) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nombre, email, password, rol }),
  });
}
