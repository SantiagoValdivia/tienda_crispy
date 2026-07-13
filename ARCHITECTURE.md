# Arquitectura del sistema: Nube/Nube

## ¿Qué significa "Nube/Nube"?

Es una forma de clasificar dónde vive cada parte de una aplicación cliente-servidor:

| Tipo            | Cliente (frontend) | Servidor (backend + BD) |
|------------------|---------------------|---------------------------|
| Local/Local      | En la misma PC       | En la misma PC             |
| Local/Nube       | En la misma PC       | Desplegado en internet     |
| **Nube/Nube**    | **Desplegado en internet** | **Desplegado en internet** |

Este proyecto se clasifica como **Nube/Nube** porque ni el cliente ni el
servidor dependen de que una PC específica esté encendida: ambos se
despliegan en servicios de internet, accesibles desde cualquier lugar.

## Diagrama

```
┌───────────────────────┐        HTTPS        ┌───────────────────────────┐
│  CLIENTE (Nube)        │ ───────────────────▶ │  SERVIDOR (Nube)           │
│  mezclados.html        │ ◀─────────────────── │  Node.js + Express         │
│  hosting estático       │      JSON / API      │  (Render / Railway / etc.) │
│  (Vercel, Netlify...)  │                       │                            │
└───────────────────────┘                       └─────────────┬──────────────┘
                                                                │
                                       ┌────────────────────────┼────────────────────────┐
                                       ▼                                                  ▼
                          ┌─────────────────────────┐                    ┌─────────────────────────┐
                          │  BASE DE DATOS (Nube)     │                    │  EVENTOS (Nube)          │
                          │  Oracle Cloud             │                    │  Google Cloud Pub/Sub     │
                          │  Autonomous Database      │                    │  + Firebase Cloud Msg.   │
                          └─────────────────────────┘                    └─────────────────────────┘
```

## Los 3 componentes en la nube

1. **Cliente (`mezclados.html`)** — se sube a un hosting estático (Vercel,
   Netlify, GitHub Pages, Firebase Hosting). El usuario lo abre desde su
   navegador sin depender de ninguna PC encendida.
2. **Servidor (este backend Node/Express)** — se despliega en un PaaS
   (Render, Railway, Google Cloud Run, AWS Elastic Beanstalk, etc.). Es el
   mismo código de `backend/src/`, solo cambia dónde corre.
3. **Base de datos (Oracle)** — en vez de Oracle XE instalado en tu PC,
   se usa **Oracle Cloud Autonomous Database** (tiene un nivel gratuito).
   Se conecta usando un archivo "wallet" en lugar de `localhost:1521/XE`.

Este mismo código soporta hoy la fase de desarrollo local (Oracle XE en tu
PC) y, sin cambiar lógica de negocio, la fase de producción Nube/Nube: solo
cambian las variables de entorno (`ORACLE_CONNECT_STRING`, credenciales
cifradas, `GCP_ENABLED=true`, y el hosting donde subes cada pieza).

## Dónde queda esto reflejado en el código

- `backend/src/config/architecture.js` — describe los 3 componentes y su
  ubicación ("Nube").
- `GET /api/health` — devuelve `"arquitectura": "Nube/Nube"`.
- Consola al iniciar el backend (`npm start`) — imprime el tipo de
  arquitectura como primera línea.
- `backend/.env.example` — comentarios explicando qué variable cambia al
  pasar de local a Oracle Cloud.

## Seguridad: usuario y contraseña cifrados

Ver la sección "Seguridad" del `README.md` para el detalle de cómo se
cifran (1) las credenciales de conexión a Oracle y (2) las contraseñas de
los usuarios que inician sesión en la app.
