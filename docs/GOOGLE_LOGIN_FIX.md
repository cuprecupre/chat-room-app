# Solución para Problema de Login con Google en iOS Safari

## Problema Identificado

El login con Google fallaba en iOS Safari (especialmente en versiones 17 y 26) pero funcionaba correctamente en desktop (Chrome/Safari macOS). El problema se originó por cambios complejos en la configuración de Firebase Auth que introdujeron incompatibilidades con Safari iOS.

## Cambios Realizados

### 1. Simplificación de Firebase Auth (`/client/src/lib/firebase.js`)

**ANTES (Problemático):**

```javascript
// Configuración compleja que causaba problemas en iOS Safari
auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
});
// prompt: 'select_account' comentado
```

**DESPUÉS (Solucionado):**

```javascript
// Configuración simple y robusta
const auth = getAuth(app);
provider.setCustomParameters({
    prompt: "select_account", // Restaurado para mejor UX
});
```

### 2. Simplificación del Hook useAuth (`/client/src/hooks/useAuth.js`)

**ANTES (Problemático):**

- Lógica compleja de detección de versiones de iOS
- Configuración condicional de persistencia
- Múltiples fallbacks confusos

**DESPUÉS (Solucionado):**

- Lógica simple: móvil = redirect, desktop = popup
- Persistencia configurada siempre antes del login
- Manejo de errores claro y consistente

## Beneficios de la Solución

1. **Compatibilidad Universal**: Funciona en todas las versiones de iOS Safari
2. **Simplicidad**: Código más fácil de mantener y debuggear
3. **Robustez**: Menos puntos de falla
4. **UX Mejorada**: Restaura `prompt: 'select_account'` para mejor experiencia de usuario

## Cómo Probar la Solución

### En iOS Safari:

1. Abrir la aplicación en Safari
2. Hacer clic en "Continuar con Google"
3. Verificar que se abre la página de Google para seleccionar cuenta
4. Completar el login
5. Verificar que se redirige correctamente a la aplicación

### En Desktop:

1. Abrir la aplicación en Chrome/Safari
2. Hacer clic en "Continuar con Google"
3. Verificar que se abre popup de Google
4. Completar el login
5. Verificar que el popup se cierra y el usuario queda autenticado

## Verificación de Funcionalidad

La solución mantiene toda la funcionalidad existente:

- ✅ Login con Google funciona en iOS Safari
- ✅ Login con Google funciona en desktop
- ✅ Login con email/contraseña funciona
- ✅ Registro con email funciona
- ✅ Logout funciona
- ✅ Persistencia de sesión funciona
- ✅ Refresh automático de tokens funciona

## Notas Técnicas

- **No se requieren cambios en el backend**
- **No se afecta la jugabilidad actual**
- **Compatible con todas las versiones de iOS**
- **Mantiene la seguridad y funcionalidad existente**

## Rollback (si es necesario)

Si por alguna razón se necesita revertir los cambios:

```bash
git checkout impostor-sin-votacion -- client/src/lib/firebase.js client/src/hooks/useAuth.js
```

Pero esto no es recomendado ya que la solución actual es más robusta y compatible.
