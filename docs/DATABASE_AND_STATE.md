# Documentación de Migración y Arquitectura v2.0 (Player State Management)

Esta documentación detalla los cambios fundamentales introducidos en la versión `v2.0` (originada en la rama `feature/player-state-management`). Esta actualización transforma la aplicación de un prototipo en memoria a un sistema robusto, persistente y tolerante a fallos.

## 🚀 Resumen Ejecutivo

*   **Persistencia Real**: Las partidas sobreviven a reinicios del servidor gracias a la integración con **Firestore**.
*   **Gestión de Estado Robusta**: Nuevo manejo de desconexiones temporales vs abandonos definitivos.
*   **OAuth 2.0 Standard**: Autenticación compatible con navegadores in-app (Instagram, TikTok) y corrección de bucles de login.
*   **Zero-Downtime Migration**: Las partidas creadas con versiones anteriores se migran automáticamente al nuevo formato al ser leídas.

---

## 💾 Cambios en Base de Datos (Firestore)

El cambio más crítico es la reestructuración del campo `players` en la colección `games` (o `dev_games`).

### Estructura de Datos (Schema v1 vs v2)

#### 🔴 ANTES (Schema v1)
Los jugadores eran una lista simple. No había distinción entre "desconectado temporalmente" y "activo".

```json
{
  "hostId": "user_123",
  "phase": "playing",
  "players": [
    { "uid": "user_123", "name": "Leandro" },
    { "uid": "user_456", "name": "Maria" }
  ]
}
```

#### 🟢 AHORA (Schema v2)
Los jugadores son un diccionario indexado por UID, permitiendo acceso O(1) y almacenamiento de metadatos de estado.

```json
{
  "schemaVersion": 2,                 // Control de versiones para migración
  "hostId": "user_123",
  "phase": "playing",
  
  "players": {
    "user_123": {
      "name": "Leandro",
      "status": "active",             // 'active', 'left', 'waiting_rejoin'
      "joinedAt": 1702700000100,      // Timestamp para orden fijo
      "leftAt": null,
      "isHost": true
    },
    "user_456": {
      "name": "Maria",
      "status": "waiting_rejoin",     // Usuario desconectado pero NO eliminado
      "joinedAt": 1702700000200,
      "leftAt": null,
      "isHost": false
    }
  },

  "playerOrder": ["user_123", "user_456"], // Orden de turnos inmutable
  "impostorHistory": ["user_456", "user_123"], // Evita repetir impostor 3 veces
  "formerPlayers": { ... } // Historial de jugadores que abandonaron
}
```

### Nuevos Estados de Jugador
*   **`active`**: Jugador conectado y participando.
*   **`waiting_rejoin`**: Jugador que perdió conexión (o cerró pestaña) mientras la partida estaba en curso. El juego reserva su lugar. Al volver a entrar, recupera su estado.
*   **`left`**: Jugador que abandonó explícitamente (botón "Salir"). Su historial se mantiene pero ya no participa.

---

## 🔄 Proceso de Migración

El sistema implementa una migración "Lazy" (bajo demanda). No se requiere una operación masiva de base de datos.

1.  **Detección**: Al cargar una partida con `Game.fromState()`, el sistema verifica si `players` es un Array.
2.  **Conversión**: Si es un Array (Schema v1), lo transforma en memoria al nuevo formato de Objeto (Schema v2), asignando `status: 'active'` y `joinedAt` sintéticos.
3.  **Persistencia**: La nueva estructura se guarda en Firestore en el siguiente ciclo de escritura.

---

## 🔐 Cambios en Autenticación (Google OAuth 2.0)

Se ha reemplazado el antiguo flujo híbrido/popup por un flujo de **Redirección Estándar OAuth 2.0**.

### Por qué el cambio?
*   **Móviles**: Los navegadores in-app (webview de Instagram/TikTok) a menudo bloquean popups, rompiendo el login anterior.
*   **Seguridad**: El nuevo flujo maneja el intercambio de tokens (Code Exchange) en el servidor (`server.js`), ocultando secretos y mejorando la seguridad.
*   **Persistencia de Sesión**: Se mejoró el manejo de cookies y tokens para evitar el bucle de "Recovering..." o recargas infinitas.

### Flujo Técnico:
1.  Cliente: Redirige a `/auth/google` (Server).
2.  Google: Redirige de vuelta a `/auth/google/callback` con un `code`.
3.  Servidor: Intercambia `code` por `tokens` de Google.
4.  Servidor: Verifica email y crea/busca usuario en Firebase.
5.  Servidor: Crea `customToken` de Firebase.
6.  Servidor: Redirige al Front (`/` o `/join/:id`) con el token en URL query param.
7.  Cliente: Captura token, autentica con Firebase, y limpia la URL.

---

## ⚠️ Consideraciones de Despliegue

Al realizar el merge a `main` y desplegar:

1.  **Reinicio de Servidor**: El servidor de Render se reiniciará.
2.  **Recuperación**: El servidor ejecutará `dbService.getActiveGames()` al iniciar.
3.  **Resultado**: Todas las partidas activas guardadas en Firestore se cargarán en memoria. Los usuarios pueden experimentar una breve desconexión de Socket.io (segundos) y reconectarán automáticamente sin perder su progreso gracias a la nueva persistencia.
