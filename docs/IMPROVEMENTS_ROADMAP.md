# Plan de Mejoras

## 🔒 Resiliencia y Detección de Errores

### 1. Health Check Endpoint
- **Prioridad:** Alta
- **Descripción:** Crear endpoint `/health` que verifique:
  - Estado del servidor
  - Conexión a Firestore activa
  - Socket.IO funcionando
- **Beneficio:** Render puede alertar si el servidor está degradado

### 2. Fail-Fast en Producción
- **Prioridad:** Alta
- **Descripción:** Modificar `db.js` para detener el servidor si Firestore no inicializa en producción
- **Archivo:** `apps/server/src/services/db.js`
- **Cambio:**
```javascript
catch (e) {
  console.error("❌ [DB Service] Failed to initialize Firestore:", e.message);
  if (process.env.NODE_ENV === 'production') {
    console.error("🛑 [DB Service] Critical: Shutting down server");
    process.exit(1);
  }
}
```
- **Beneficio:** Evita que el servidor corra sin persistencia activa

### 3. Test de Integración para DBService
- **Prioridad:** Media
- **Descripción:** Test que verifique que `dbService.initialize()` funciona correctamente
- **Archivo:** `apps/server/src/__tests__/DBService.test.js`
- **Beneficio:** Detecta dependencias faltantes antes del deploy

---

## ⚡ Optimizaciones de Rendimiento

### 4. Code Splitting (Lazy Loading)
- **Prioridad:** Alta
- **Descripción:** Dividir el bundle del cliente en chunks más pequeños
- **Archivos:** `apps/client/src/routes/AppRouter.jsx`
- **Cambios:**
  - Usar `React.lazy()` para cargar páginas bajo demanda
  - Implementar `Suspense` con fallback de loading
- **Beneficio:** Reduce tiempo de carga inicial (~30-40% menos JS)

### 5. Delta Updates (Actualizaciones Incrementales)
- **Prioridad:** Media
- **Descripción:** Enviar solo los cambios del estado en vez del estado completo
- **Archivos:** `apps/server/src/game/GameStateSerializer.js`
- **Cambios:**
  - Implementar diffing del estado
  - Enviar solo propiedades modificadas via Socket.IO
- **Beneficio:** Reduce hasta 80% el bandwidth en actualizaciones frecuentes

### 6. Play Again State Reset
- **Prioridad:** Media
- **Descripción:** Optimizar el reinicio de partida para no reenviar todo el estado
- **Archivos:** `apps/server/src/Game.js`
- **Cambios:**
  - Limpiar solo campos necesarios
  - Mantener datos de jugadores conectados
- **Beneficio:** Transición más rápida entre partidas

### 7. Binary Serialization (MessagePack)
- **Prioridad:** Baja
- **Descripción:** Usar MessagePack en vez de JSON para Socket.IO
- **Dependencia:** `socket.io-msgpack-parser`
- **Beneficio:** ~30% menos tamaño de payload
- **Nota:** Requiere cambios en cliente y servidor simultáneamente

---

## 📊 Historial de Incidentes Resueltos

| Fecha | Incidente | Solución | PR |
|-------|-----------|----------|-----|
| 2025-12-22 | Firestore no persistía por falta de `@opentelemetry/api` | Añadida dependencia | [#17](https://github.com/cuprecupre/chat-room-app/pull/17) |
