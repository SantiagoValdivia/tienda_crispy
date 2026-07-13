# Panel de Administración — Backend (Node + Express + Oracle + GCP)

Backend funcional que conecta Oracle con una capa de eventos (Pub/Sub +
FCM) que puedes activar más adelante. Mientras no tengas un proyecto de
Google Cloud, el sistema funciona igual: solo simula el envío de
notificaciones en la consola, sin bloquear ni afectar el guardado real en
Oracle.

---

## Arquitectura: Nube/Nube

Este proyecto está diseñado como arquitectura **Nube/Nube**: tanto el
cliente (frontend) como el servidor (backend + base de datos) están
pensados para desplegarse en internet, no para depender de una PC
encendida. El detalle completo, con diagrama, está en
**[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

Resumen rápido:

| Componente     | Dónde vive                                  |
|-----------------|----------------------------------------------|
| Frontend        | Hosting en la nube (Vercel, Netlify, etc.)   |
| Backend         | PaaS en la nube (Render, Railway, etc.)      |
| Base de datos   | Oracle Cloud (Autonomous Database)           |
| Eventos         | Google Cloud (Pub/Sub + FCM)                 |

Mientras desarrollas puedes seguir usando Oracle XE local (este README lo
explica paso a paso más abajo); migrar a la nube es solo cuestión de
cambiar variables de entorno, sin tocar la lógica de negocio.

---

## Seguridad: usuario y contraseña cifrados

Hay dos tipos distintos de "usuario y contraseña" en este proyecto, y
ambos están cifrados/hasheados, nunca en texto plano dentro de la base de
datos ni en el repositorio:

### 1. Credenciales de conexión a Oracle (`ORACLE_USER` / `ORACLE_PASSWORD`)

Se cifran con **AES-256-GCM** antes de guardarlas en `.env`:

```bash
cd backend
node scripts/generate-key.js                              # genera ENCRYPTION_KEY (una sola vez)
node scripts/encrypt-credentials.js system TU_PASSWORD     # cifra usuario y password
```

Copia el resultado (`ORACLE_USER_ENC` y `ORACLE_PASSWORD_ENC`) a tu `.env`
y borra las variables `ORACLE_USER` / `ORACLE_PASSWORD` en texto plano. El
backend las descifra en memoria una sola vez, al iniciar el pool de
conexiones (`backend/src/db/oracle.js`), y nunca las escribe a disco ni a
los logs.

### 2. Contraseña de los usuarios que inician sesión en la app

Se guardan con **hash bcrypt** (columna `usuarios.password_hash`), que a
diferencia del cifrado no es reversible: ni el propio backend puede
"recuperar" la contraseña original, solo puede compararla.

```bash
# Crear un usuario con contraseña
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Admin\",\"email\":\"admin@empresa.com\",\"password\":\"MiPassword123\",\"rol\":\"ADMINISTRADOR\"}"

# Iniciar sesión (devuelve un JWT)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@empresa.com\",\"password\":\"MiPassword123\"}"
```

El login exitoso devuelve un **JWT** (firmado con `JWT_SECRET` en `.env`)
que el frontend puede guardar y reenviar en peticiones futuras, en vez de
mandar la contraseña otra vez.

---

## Inicio rápido (léeme primero)

Si solo quieres dejarlo andando sin profundizar en cómo funciona, abre
**`INICIO_RAPIDO.txt`** en la raíz del proyecto: son 3 pasos con doble
clic sobre archivos `.bat`, pensados para Windows. El resto de este
README es la versión detallada/manual, útil si algo falla o si quieres
entender qué hace cada cosa.

---


## 1. Estructura del proyecto

```
backend/
├── package.json
├── .env.example          <- copiar como .env y rellenar
├── scripts/
│   ├── generate-key.js          <- genera la clave maestra de cifrado
│   └── encrypt-credentials.js   <- cifra usuario/password de Oracle
└── src/
    ├── server.js          <- punto de entrada
    ├── config/architecture.js  <- metadata de arquitectura (Nube/Nube)
    ├── db/oracle.js        <- conexión/pool a Oracle (descifra credenciales)
    ├── utils/crypto.js     <- cifrado AES-256-GCM de credenciales
    ├── services/
    │   ├── gcpService.js          <- Pub/Sub + FCM (real o simulado)
    │   ├── movimientosService.js  <- lógica de negocio (Oracle + GCP)
    │   └── authService.js         <- registro/login (bcrypt + JWT)
    └── routes/
        ├── movimientos.js     <- endpoints de stock/movimientos
        └── auth.js            <- endpoints de registro/login

oracle/
└── schema.sql            <- script para crear las tablas en tu Oracle

ARCHITECTURE.md           <- diagrama y explicación de la arquitectura Nube/Nube
```

---

## 2. Preparar Oracle XE

1. Abre **SQL Developer** (o SQL*Plus) y conéctate a tu Oracle XE local
   (usuario `system`, el password que pusiste al instalar XE).
2. Ejecuta el script `oracle/schema.sql`. Esto crea las tablas
   `usuarios`, `stock`, `movimientos` y carga datos de ejemplo.
3. Verifica que el listener de Oracle esté activo en el puerto **1521**
   (es el puerto por defecto del instalador de XE, normalmente no hay
   que tocarlo).

> Para confirmar el connect string correcto, en SQL Developer revisa los
> datos de tu conexión: normalmente es `localhost:1521/XE`.

---

## 3. Instalar el Oracle Instant Client (necesario para Node)

El driver `oracledb` de Node necesita el **Oracle Instant Client** instalado
en tu máquina (es una librería nativa, no se instala solo con npm):

1. Descarga el Instant Client "Basic" para tu sistema operativo desde la
   página oficial de Oracle (busca "Oracle Instant Client downloads").
2. Descomprímelo en una carpeta, por ejemplo `C:\oracle\instantclient_21_x`
   (Windows) o `/opt/oracle/instantclient_21_x` (Linux/Mac).
3. Agrega esa carpeta a tu variable de entorno `PATH` (Windows) o
   `LD_LIBRARY_PATH` (Linux) / `DYLD_LIBRARY_PATH` (Mac).
4. Reinicia la terminal después de cambiar el PATH.

Si ya tienes Oracle XE completo instalado (no solo el motor), es posible
que el Instant Client ya esté disponible en la carpeta de instalación de
XE y no necesites este paso. Si al correr el backend ves un error tipo
`DPI-1047`, es señal de que falta este cliente.

---

## 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

Esto instalará `express`, `oracledb`, `dotenv`, `cors`,
`@google-cloud/pubsub` y `firebase-admin` (las dos últimas no se activan
hasta que tú lo decidas, ver paso 6).

---

## 5. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y coloca tu password real de Oracle (texto plano, solo para
arrancar rápido):

```
ORACLE_USER=system
ORACLE_PASSWORD=tu_password_real
ORACLE_CONNECT_STRING=localhost:1521/XE
GCP_ENABLED=false
```

Déjalo en `GCP_ENABLED=false` por ahora.

**Recomendado:** en vez de dejar el password en texto plano, cifra las
credenciales (ver sección "Seguridad" más arriba):

```bash
node scripts/generate-key.js
node scripts/encrypt-credentials.js system tu_password_real
```

Y pega el resultado en `.env` como `ORACLE_USER_ENC` / `ORACLE_PASSWORD_ENC`,
borrando `ORACLE_USER` / `ORACLE_PASSWORD`. También define `JWT_SECRET`
(cualquier cadena aleatoria larga; puedes reutilizar el mismo script
`generate-key.js` para generarla).

---

## 6. Ejecutar el backend

```bash
npm start
```

Si todo está bien configurado, verás:

```
[Oracle] Pool de conexiones inicializado correctamente (credenciales descifradas en memoria).
[GCP] Modo SIMULADO activo (GCP_ENABLED=false). No se conecta a servicios reales.

=================================================
  Arquitectura: Nube/Nube (ver ARCHITECTURE.md)
  Backend escuchando en http://localhost:8080
  Endpoints disponibles:
    GET  /api/health
    GET  /api/stock
    GET  /api/usuarios
    GET  /api/movimientos
    POST /api/movimientos
    POST /api/auth/register
    POST /api/auth/login
=================================================
```

---

## 7. Probar los endpoints

Con el backend corriendo, en otra terminal:

```bash
# Ver inventario actual
curl http://localhost:8080/api/stock

# Ver usuarios
curl http://localhost:8080/api/usuarios

# Registrar un movimiento (entrada de stock)
curl -X POST http://localhost:8080/api/movimientos \
  -H "Content-Type: application/json" \
  -d "{\"stockId\":1,\"usuarioId\":2,\"tipo\":\"ENTRADA\",\"cantidad\":10,\"rol\":\"DISTRIBUIDOR\"}"

# Ver historial de movimientos
curl http://localhost:8080/api/movimientos

# Registrar un usuario con contraseña (queda guardada como hash bcrypt)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Admin\",\"email\":\"admin2@empresa.com\",\"password\":\"MiPassword123\",\"rol\":\"ADMINISTRADOR\"}"

# Iniciar sesión (devuelve un JWT)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin2@empresa.com\",\"password\":\"MiPassword123\"}"
```

Al registrar el movimiento, en la consola del backend verás algo así
(esto es el modo simulado de GCP en acción):

```
[Oracle] Movimiento confirmado: producto=Componentes Electronicos (Kit ICE), tipo=ENTRADA, cantidad=10
[GCP][SIMULADO] Se habria publicado en Pub/Sub: {...}
[GCP][SIMULADO] Se habria enviado FCM a token=...: "Stock actualizado" - "Entrada de 10 unidades..."
```

Esto confirma que el flujo completo Backend → Oracle → "GCP" funciona,
aunque todavía no tengas cuenta de Google Cloud.

---

## 8. Conectar el Frontend (mezclados.html)

Tu archivo `mezclados.html` actualmente simula el guardado con un `alert()`.
Para conectarlo de verdad al backend, reemplaza ese bloque por una llamada
`fetch` real, por ejemplo:

```javascript
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("http://localhost:8080/api/movimientos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stockId: 1,        // deberías mapear el <select> de producto a un id real
      usuarioId: 2,
      tipo: "ENTRADA",
      cantidad: Number(document.querySelector('input[type=number]').value),
      rol: "DISTRIBUIDOR",
    }),
  });
  const data = await res.json();
  console.log("Respuesta del backend:", data);
});
```

Si quieres, en un siguiente paso te conecto el HTML completo a estos
endpoints (cargar el stock real desde `/api/stock` en el `<select>`,
mostrar el historial real en el timeline, etc.) — dime y lo hacemos.

---

## 9. Activar Google Cloud de verdad (cuando quieras)

Cuando decidas crear tu proyecto en GCP:

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto nuevo.
2. Habilita las APIs **Cloud Pub/Sub** y **Firebase Cloud Messaging**.
3. Crea un tópico de Pub/Sub, por ejemplo `topico-movimientos`.
4. En **IAM y administración → Cuentas de servicio**, crea una cuenta de
   servicio con rol "Editor de Pub/Sub" y "Firebase Admin SDK".
5. Descarga su clave en formato **JSON** y guárdala como
   `backend/credentials/service-account.json` (no la subas a git).
6. En tu `.env`, cambia:
   ```
   GCP_ENABLED=true
   GCP_PROJECT_ID=el-id-de-tu-proyecto
   GCP_PUBSUB_TOPIC=topico-movimientos
   GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json
   ```
7. Reinicia el backend (`npm start`). Verás
   `[GCP] Clientes de Pub/Sub y Firebase Admin inicializados (modo REAL).`
   y a partir de ahí los eventos se publican de verdad.

No necesitas cambiar nada más en el código: el mismo `movimientosService.js`
funciona en ambos modos porque la decisión está centralizada en
`gcpService.js`.

---

## 10. Puertos usados en este proyecto

| Componente          | Puerto                  |
|----------------------|--------------------------|
| Frontend (HTML)      | el que uses para servirlo, ej. 5500 |
| Backend (Express)    | 8080                     |
| Oracle XE            | 1521                     |
| GCP Pub/Sub / FCM    | 443 (HTTPS, manejado internamente por las librerías de Google) |
