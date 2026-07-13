// src/config/architecture.js
// -----------------------------------------------------------------------
// Metadata de arquitectura del sistema. No afecta la logica de negocio:
// existe para dejar EXPLICITO en el codigo (y en /api/health) que este
// proyecto esta diseñado como arquitectura "Nube/Nube":
//
//   Cliente (frontend, mezclados.html) --> corre/se sirve desde la nube
//   Servidor (este backend Node/Express) --> se despliega en la nube
//   Base de datos (Oracle) --> Oracle Cloud (Autonomous Database), no
//                               una instalacion local de Oracle XE
//
// Ver ARCHITECTURE.md en la raiz del proyecto para el diagrama completo
// y la explicacion de por que se clasifica asi (vs. Local/Local o
// Local/Nube).
// -----------------------------------------------------------------------

const ARCHITECTURE = {
  tipo: "Nube/Nube",
  descripcion:
    "Cliente y servidor se ejecutan fuera de la maquina local: el frontend " +
    "se sirve desde un hosting en la nube, el backend se despliega en un " +
    "servicio en la nube (PaaS) y la base de datos es Oracle Cloud, no una " +
    "instalacion local.",
  componentes: {
    cliente: {
      nombre: "Frontend (.html)",
      ubicacion: "Nube",
      ejemplo: "Hosting estatico (Vercel, Netlify, GitHub Pages, etc.)",
    },
    servidor: {
      nombre: "Backend (Node/Express)",
      ubicacion: "Nube",
      ejemplo: "PaaS (Render, Railway, Cloud Run, App Engine, etc.)",
    },
    baseDeDatos: {
      nombre: "Oracle",
      ubicacion: "Nube",
      ejemplo: "Oracle Cloud Autonomous Database",
    },
    eventos: {
      nombre: "Pub/Sub + FCM",
      ubicacion: "Nube",
      ejemplo: "Google Cloud Platform",
    },
  },
};

module.exports = { ARCHITECTURE };
