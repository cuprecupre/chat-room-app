---
description: Guía de resolución de problemas comunes
---

# Troubleshooting Guide

Guía de resolución de problemas comunes del proyecto "El Impostor".

## Problemas de Inicio del Servidor

### Error: `EADDRINUSE` - Puerto ya en uso

**Síntomas:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solución:**

1. Ver qué proceso está usando el puerto:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

2. Opciones:
    - **Opción A**: Matar el proceso (si es seguro):
        ```bash
        kill -9 <PID>
        ```
    - **Opción B**: Usar otro puerto (recomendado):
        ```bash
        PORT=4000 npm run dev
        ```
    - **Opción C**: Usar el script de stop:
        ```bash
        ./stop.sh
        ```

### Error: `Client build not found`

**Síntomas:**

```
Client build not found. Run "npm run build" inside the client/ folder.
```

**Causa:** El directorio `client/dist` no existe.

**Solución:**

```bash
cd client
npm install
npm run build
cd ..
npm start
```

O simplemente:

```bash
npm install  # El postinstall hook hace el build automáticamente
```

## Problemas de Firebase/Autenticación

### Error: `ENOTFOUND metadata.google.internal`

**Síntomas:**

```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

**Causa:** Faltan credenciales de Firebase.

**Solución:**

1. Verificar que `.env` existe y tiene:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

2. Verificar que el archivo existe:

```bash
ls -la firebase-service-account.json
```

3. Si no existe, obtenerlo desde Firebase Console:
    - Ve a Project Settings → Service Accounts
    - Click "Generate New Private Key"
    - Guardar como `firebase-service-account.json`

### Error: `Authentication error: Invalid token`

**Síntomas:**

- Socket.IO connection rechazada
- Error 401 en consola del cliente
- Mensaje "Invalid token" en logs del servidor

**Causa:** Token de Firebase inválido o expirado.

**Solución:**

1. **Logout y Login nuevamente:**
    - Click en logout en el cliente
    - Login de nuevo con Google

2. **Verificar fecha/hora del sistema:**
    - Tokens JWT dependen de timestamps
    - Asegura que la hora del sistema es correcta

3. **Verificar configuración de Firebase en cliente:**

    ```javascript
    // client/src/lib/firebase.js
    // Verificar que apiKey y projectId son correctos
    ```

4. **Revisar logs del servidor para más detalles:**
    - Busca el error completo en la consola
    - Verifica que `decodedToken.uid` existe

### Login con Google no funciona en iOS Safari

**Síntomas:**

- Popup no se abre
- Redirect se bloquea
- Login funciona en desktop pero no en móvil

**Causa:** Políticas de privacidad de Safari iOS (cookies de terceros).

**Solución:** Ya implementada en el código actual.

Ver detalles completos en: `docs/historical/GOOGLE_LOGIN_FIX.md`

## Problemas de CORS

### Error: `Not allowed by CORS`

**Síntomas:**

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Causa:** El origen del cliente no está en `CLIENT_ORIGINS`.

**Solución:**

1. Verificar `.env`:

```bash
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:4000
```

2. Asegurar que no hay espacios extras:

```bash
# ✅ Correcto
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174

# ❌ Incorrecto (espacios después de comas)
CLIENT_ORIGINS=http://localhost:5173, http://localhost:5174
```

3. Reiniciar el servidor después de cambiar `.env`

4. En producción (Render), verificar que la variable de entorno incluye el dominio correcto

## Problemas de Socket.IO

### Socket.IO no conecta

**Síntomas:**

- En consola del cliente: `WebSocket connection failed`
- Eventos no se emiten/reciben

**Diagnóstico:**

1. Verificar que el servidor está corriendo
2. Verificar que el puerto es correcto
3. Revisar CORS (ver sección anterior)

**Solución:**

1. Verificar configuración en cliente:

```javascript
// client/src/App.jsx
const socket = io(SERVER_URL, {
    auth: {
        token: user.stsTokenManager.accessToken,
        // ...
    },
});
```

2. Verificar que el token se propaga:

```javascript
console.log("Token:", user.stsTokenManager.accessToken);
```

3. Revisar logs del servidor:

```bash
# Buscar errores de autenticación
grep "Authentication error" server.log
```

### Eventos Socket.IO no se reciben

**Síntomas:**

- Emisión de eventos no tiene efecto
- Estado no se sincroniza entre clientes

**Diagnóstico:**

1. **Verificar que el evento está registrado:**

```javascript
// En el cliente
socket.on("game-state", (state) => {
    console.log("Received game-state:", state);
});
```

2. **Verificar que se emite correctamente:**

```javascript
// En el servidor
socket.emit("game-state", game.getStateFor(userId));
```

**Solución:**

1. Verificar el nombre del evento (case-sensitive)
2. Verificar que el socket está conectado antes de emitir
3. Usar `socket.io` devtools en Chrome para debuggear

### Desconexiones frecuentes

**Síntomas:**

- Usuarios se desconectan aleatoriamente
- Reconexión constante

**Causa:** Timeout de red, problemas de Render free tier, o bugs en el código.

**Solución:**

1. **Aumentar timeout:**

```javascript
// server.js
const io = socketIo(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
});
```

2. **Verificar heartbeat:**

- Ver código en `server.js` (userHeartbeats)
- Verificar que se limpian correctamente

3. **En producción (Render):**

- Render free tier puede tener limitaciones
- Considerar upgrade a plan pagado

## Problemas de Estado del Juego

### Roles no se asignan correctamente

**Síntomas:**

- Todos ven la misma palabra (o todos son impostores)
- Los roles no coinciden con lo esperado

**Causa:** Bug en `Game.js` o estado inconsistente.

**Diagnóstico:**

1. Revisar logs del servidor:

```bash
# Buscar logs de asignación de roles
grep "impostor" server.log
```

2. Verificar método `selectImpostorWithLimit()` en `Game.js`

**Solución:**

1. Verificar que el impostor se selecciona aleatoriamente:

```javascript
// Game.js - selectImpostorWithLimit()
console.log("Selected impostor:", impostorId);
```

2. Verificar que `getStateFor()` devuelve datos específicos por jugador

3. Si el problema persiste, ejecutar tests:

```bash
npm test -- Game.test.js
```

### Votación no funciona

**Síntomas:**

- Votos no se registran
- Contador de votos no se actualiza
- No se procesan resultados

**Diagnóstico:**

1. Verificar evento `cast-vote` en servidor:

```javascript
// server.js
socket.on("cast-vote", ({ targetId }) => {
    console.log("Vote from:", user.uid, "to:", targetId);
});
```

2. Verificar método `castVote()` en `Game.js`

**Solución:**

1. Verificar que el jugador está activo (no eliminado)
2. Verificar que el juego está en fase de votación
3. Revisar logs del servidor para encontrar el error específico

### Puntuación incorrecta

**Síntomas:**

- Puntos no se asignan correctamente
- Puntos negativos
- Puntos no coinciden con las reglas

**Causa:** Bug en `calculateRoundScores()` en `Game.js`.

**Solución:**

1. Revisar lógica en `Game.js`:

```javascript
// Game.js - calculateRoundScores()
// Amigos: +1 por votar correctamente, +1 adicional si ganan
// Impostor: +2/+3/+4 según vuelta
```

2. Ejecutar tests:

```bash
npm test -- Game.test.js
```

3. Si la lógica está mal, ver `.agent/context/game-logic.md` para reglas correctas

## Problemas de Reconexión

### Reconexión no funciona

**Síntomas:**

- Al cerrar y reabrir pestaña, el usuario no vuelve al juego
- Estado se pierde

**Causa:** Periodo de gracia expirado o bug en lógica de reconexión.

**Diagnóstico:**

1. Verificar logs del servidor:

```bash
grep "disconnected\|reconnected" server.log
```

2. Verificar timeout de periodo de gracia:

```javascript
// server.js - Por defecto 30 segundos
setTimeout(() => {
    /* ... */
}, 30000);
```

**Solución:**

1. Verificar que el usuario hace login con la misma cuenta
2. Aumentar periodo de gracia si es necesario
3. Revisar lógica en `server.js` (evento `connection` y `pendingDisconnects`)

## Problemas de Build

### Build de Vite falla

**Síntomas:**

```
error during build:
...
```

**Causa:** Error de sintaxis, dependencias faltantes, o configuración incorrecta.

**Solución:**

1. Verificar que no hay errores de lint:

```bash
cd client
npm run lint
```

2. Limpiar node_modules y reinstalar:

```bash
rm -rf node_modules package-lock.json
npm install
```

3. Verificar versión de Node.js:

```bash
node --version  # Debe ser >= 18
```

## Problemas de Producción (Render)

### Deployment falla

**Síntomas:**

- Build en Render falla
- Logs muestran errores

**Solución:**

1. Revisar logs de build en Render Dashboard
2. Verificar que `package.json` tiene scripts correctos
3. Verificar que variables de entorno están configuradas
4. Ver workflow completo en: `.agent/workflows/deployment.md`

### App funciona local pero no en producción

**Causas comunes:**

- Variables de entorno faltantes
- CORS mal configurado
- OAuth redirect URIs no configurados

**Solución:**

1. Verificar TODAS las variables de entorno en Render
2. Verificar `CLIENT_ORIGINS` incluye el dominio de Render
3. Verificar OAuth redirect URIs en Google Console
4. Ver checklist completo en: `.agent/workflows/deployment.md`

## Estrategia General de Debugging

1. **Reproducir el problema localmente**
2. **Revisar logs** (servidor y cliente)
3. **Aislar**: ¿Es frontend, backend, o networking?
4. **Verificar cambios recientes**: `git log` y `git diff`
5. **Revertir a commit estable** si es necesario:
    ```bash
    git fetch origin
    git reset --hard origin/main
    ```
6. **Ejecutar smoke test** (ver `.agent/workflows/testing.md`)
7. **Consultar documentación** relevante

## Última Opción: Rollback Completo

Si todo falla y necesitas volver a un estado estable:

```bash
git fetch origin
git reset --hard origin/main
git clean -fdx
npm install
./start.sh
```

⚠️ **ADVERTENCIA**: Esto elimina TODOS los cambios locales.

## Referencias

- Workflows: `.agent/workflows/`
- Invariantes críticas: `.agent/rules/critical-invariants.md`
- Guía de mantenimiento: `MAINTAINERS_GUIDE.md`
- Contexto del proyecto: `.agent/context/`
