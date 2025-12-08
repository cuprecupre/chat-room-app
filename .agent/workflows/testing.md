---
description: Workflow de testing y validación
---

# Workflow de Testing

Este workflow describe cómo ejecutar tests y validar cambios antes de desplegar.

## Tests Automatizados

### Tests Existentes

El proyecto incluye tests con Jest:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con coverage
npm test -- --coverage
```

### Archivos de Test

- `Game.test.js` - Tests de la lógica del juego
- `test-mobile-login.js` - Test de login en móvil (Puppeteer)

### Agregar Nuevos Tests

Crear archivos `*.test.js` en la raíz o en `__tests__/`:

```javascript
// Ejemplo: MyFeature.test.js
describe('MyFeature', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Smoke Test Manual (CRÍTICO)

Este test DEBE ejecutarse SIEMPRE antes de hacer push a `main`.

### Setup

1. Servidor corriendo localmente (ver `.agent/workflows/development.md`)
2. Dos navegadores:
   - **Navegador A**: Normal (Chrome/Safari)
   - **Navegador B**: Ventana de incógnito

### Checklist de Smoke Test

#### 1. Login y Autenticación

**Navegador A:**
- [ ] Abrir http://localhost:5173
- [ ] Click en "Continuar con Google"
- [ ] Completar login con cuenta de prueba
- [ ] Verificar que aparece la pantalla principal
- [ ] Verificar que NO hay errores en consola

**Navegador B (Incógnito):**
- [ ] Abrir http://localhost:5173
- [ ] Login con otra cuenta Google
- [ ] Verificar login exitoso

#### 2. Crear y Unirse a Partida

**Navegador A:**
- [ ] Click en "Crear Partida"
- [ ] Verificar que se muestra el código de sala
- [ ] Verificar que apareces en la lista de jugadores
- [ ] Copiar el código de sala

**Navegador B:**
- [ ] Click en "Unirse a Partida"
- [ ] Pegar el código de sala
- [ ] Click en "Unirse"
- [ ] Verificar que apareces en la lista de ambas ventanas

#### 3. Iniciar Juego y Verificar Roles

**Navegador A (como host):**
- [ ] Click en "Iniciar Juego"
- [ ] Verificar que se asigna un rol (Amigo o Impostor)
- [ ] Si eres Amigo: verificar que ves la palabra secreta
- [ ] Si eres Impostor: verificar que ves la pista/categoría

**Navegador B:**
- [ ] Verificar que se asigna un rol
- [ ] Verificar que el estado del juego se sincroniza

**Consola del Servidor:**
- [ ] Sin errores
- [ ] Logs muestran roles asignados correctamente

#### 4. Sistema de Turnos

**Ambos navegadores:**
- [ ] Verificar que el jugador inicial tiene el icono 🎯
- [ ] Verificar que la lista de jugadores está ordenada
- [ ] Verificar que el orden es consistente en ambas ventanas

#### 5. Votación

**Navegador A:**
- [ ] Click en un jugador para votar
- [ ] Verificar que tu voto se registra

**Navegador B:**
- [ ] Votar por un jugador
- [ ] Verificar que se actualiza el contador de votos

**Ambos navegadores:**
- [ ] Una vez todos votan, verificar que se procesan resultados
- [ ] Si hay eliminado: verificar que se marca correctamente
- [ ] Si hay empate: verificar que pasa a siguiente vuelta
- [ ] Verificar actualización de puntuación

#### 6. Reconexión y Periodo de Gracia

**Navegador B:**
- [ ] Cerrar la pestaña completa (simular desconexión)
- [ ] Esperar 3-5 segundos

**Navegador A:**
- [ ] Verificar que el jugador B aparece como "desconectado"
- [ ] Verificar que el juego NO lo elimina inmediatamente

**Navegador B:**
- [ ] Reabrir http://localhost:5173
- [ ] Login con la misma cuenta
- [ ] Verificar que reconecta automáticamente
- [ ] Verificar que el estado del juego se restaura

**Consola del Servidor:**
- [ ] Verificar logs de "User disconnected" y "User reconnected"
- [ ] Sin errores

#### 7. Finalizar Ronda

**Continuar votando hasta:**
- [ ] Eliminar al impostor (victoria de amigos)
  - O bien: Sobrevivir 3 vueltas (victoria del impostor)
- [ ] Verificar que se muestra pantalla de resultados
- [ ] Verificar que los puntos se asignan correctamente
- [ ] Verificar que se muestra la palabra secreta

#### 8. Jugar Otra Vez

**Navegador A:**
- [ ] Click en "Jugar Otra Vez"
- [ ] Verificar que se resetea el estado
- [ ] Verificar que se asignan nuevos roles
- [ ] Verificar que los puntos acumulados se mantienen

#### 9. Abandonar Partida

**Navegador B:**
- [ ] Click en "Abandonar"
- [ ] Verificar que sales de la partida

**Navegador A:**
- [ ] Verificar que el jugador B ya no aparece en la lista
- [ ] Verificar que el orden de jugadores se actualiza

#### 10. Verificación de Consolas

**Consola del Navegador (ambos):**
- [ ] Sin errores (los warnings son aceptables)
- [ ] Solo logs informativos

**Consola del Servidor:**
- [ ] Sin errores ni excepciones
- [ ] Solo logs de eventos normales

## Testing en Móviles

### iOS Safari (Crítico)

El login con Google tiene particularidades en iOS Safari.

**Setup:**
1. Servidor accesible desde red local o túnel (ej: ngrok)
2. Dispositivo iOS con Safari

**Test:**
- [ ] Abrir la URL en Safari iOS
- [ ] Click en "Continuar con Google"
- [ ] Verificar que se abre la página de Google (no popup)
- [ ] Completar login
- [ ] Verificar que redirige correctamente a la app
- [ ] Verificar que queda autenticado

**Nota**: Ver solución de problemas en `docs/historical/GOOGLE_LOGIN_FIX.md`

### Android Chrome

- [ ] Login con Google funciona (popup o redirect)
- [ ] Juego funciona correctamente
- [ ] Reconexión funciona

## Testing de Regresión

Cuando hagas cambios en archivos críticos, verifica que no rompiste nada:

### Cambios en `server.js`
- [ ] Ejecutar smoke test completo
- [ ] Verificar autenticación
- [ ] Verificar Socket.IO connections

### Cambios en `Game.js`
- [ ] Ejecutar `npm test` (Game.test.js)
- [ ] Ejecutar smoke test completo
- [ ] Verificar lógica de votación
- [ ] Verificar sistema de puntos

### Cambios en `App.jsx` o componentes principales
- [ ] Smoke test completo
- [ ] Verificar todas las pantallas
- [ ] Verificar responsive design (móvil y desktop)

### Cambios en Firebase/Autenticación
- [ ] Login en desktop (popup)
- [ ] Login en móvil (redirect)
- [ ] Logout
- [ ] Reconexión tras desconexión

## Testing de Performance

### Conexiones Simultáneas

```bash
# Test con múltiples jugadores (requiere Puppeteer)
node test-mobile-login.js
```

### Memory Leaks

Verificar en Chrome DevTools:
1. Performance → Memory
2. Tomar heap snapshot inicial
3. Jugar varias rondas
4. Tomar heap snapshot final
5. Comparar: no debe haber crecimiento significativo

## Criterios de Aceptación

Un cambio está listo para producción si:

✅ Pasa el smoke test completo sin errores
✅ Tests automatizados pasan: `npm test`
✅ No hay errores en consola (cliente y servidor)
✅ Funciona en Chrome, Safari, Firefox
✅ Funciona en móvil (iOS Safari y Android Chrome)
✅ Reconexión funciona correctamente
✅ No rompe ninguna invariante crítica (ver `.agent/rules/critical-invariants.md`)

## Referencias

- Smoke test completo: `MAINTAINERS_GUIDE.md` (líneas 93-109)
- Invariantes críticas: `.agent/rules/critical-invariants.md`
- Solución iOS Safari: `docs/historical/GOOGLE_LOGIN_FIX.md`
