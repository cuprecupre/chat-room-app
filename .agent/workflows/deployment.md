---
description: Workflow de deployment en Render
---

# Workflow de Deployment

Este workflow describe cómo desplegar el proyecto en Render.com (producción).

## Configuración de Render

El proyecto usa **Render.com** para deployment automático.

### Configuración Actual

Archivo `render.yaml` define el servicio:

```yaml
services:
    - type: web
      name: impostor-game
      runtime: node
      plan: free
      buildCommand: npm install
      startCommand: npm start
      autoDeploy: true
      envVars:
          - key: NODE_ENV
            value: production
```

### Variables de Entorno en Render

Configurar en el panel de Render (Settings → Environment):

**Obligatorias:**

1. **NODE_ENV**: `production`
2. **PORT**: `10000` (Render asigna automáticamente, pero se puede especificar)
3. **CLIENT_ORIGINS**: URLs autorizadas separadas por coma
    - Ejemplo: `https://impostor-game.onrender.com,https://tu-dominio.com`
4. **FIREBASE_SERVICE_ACCOUNT**: JSON completo de la cuenta de servicio
    - Copiar el contenido completo del archivo `firebase-service-account.json`
    - Pegar como string en una sola línea

**OAuth (Google Cloud Console):**

5. Configurar redirect URIs en Google OAuth:
    - `https://tu-dominio.onrender.com/__/auth/handler`
    - Ver más en: `docs/historical/FIREBASE_DOMAIN_SOLUTION.md`

## Proceso de Deployment

### Deployment Automático (Recomendado)

El proyecto tiene `autoDeploy: true`, por lo que:

1. **Hacer push a `main`**:

    ```bash
    git add .
    git commit -m "Descripción del cambio"
    git push origin main
    ```

2. **Render detecta el push** y automáticamente:
    - Clona el repositorio
    - Ejecuta `npm install` (buildCommand)
    - Ejecuta el postinstall hook que builds el cliente
    - Inicia el servidor con `npm start`

3. **Monitorear deployment**:
    - Ve a Render Dashboard
    - Click en el servicio "impostor-game"
    - Ve a "Logs" para ver el progreso
    - Espera a que el estado cambie a "Live"

### Deployment Manual

Si necesitas forzar un redeploy sin cambios:

1. Ve a Render Dashboard
2. Click en el servicio
3. Click "Manual Deploy" → "Deploy latest commit"

## Verificación Post-Deployment

### 1. Verificar que el Servicio Está Activo

```bash
curl -I https://tu-dominio.onrender.com
```

Debes recibir `200 OK`.

### 2. Probar Login

1. Abre la URL en navegador
2. Click en "Continuar con Google"
3. Completa el login
4. Verifica que no hay errores en consola del navegador

### 3. Probar Funcionalidad Básica

Ejecutar smoke test completo:

1. **Crear partida**: Login → Crear partida
2. **Unirse**: Abrir en incógnito → Login → Unirse con código
3. **Iniciar juego**: Verificar que se asignan roles
4. **Votación**: Hacer una votación de prueba
5. **Reconexión**: Cerrar pestaña y volver a abrir, verificar reconexión

### 4. Revisar Logs de Producción

En Render Dashboard → Logs, verificar:

✅ No hay errores de Firebase
✅ No hay errores de autenticación
✅ Socket.IO connections funcionan
✅ No hay errores de CORS

## Rollback Strategy

### Opción 1: Revertir Commit

Si el deployment introduce un bug:

```bash
# Revertir al commit anterior
git revert HEAD
git push origin main
```

Render automáticamente desplegará el commit de revert.

### Opción 2: Rollback Manual en Render

1. Ve a Render Dashboard
2. Click en el servicio
3. Ve a "Events"
4. Encuentra el deployment anterior estable
5. Click "Redeploy"

### Opción 3: Rollback a Commit Específico

```bash
# Encontrar el hash del commit estable
git log --oneline

# Revertir a ese commit
git reset --hard <commit-hash>
git push origin main --force
```

⚠️ **ADVERTENCIA**: `--force` reescribe el historial. Usar solo en emergencias.

## Monitoreo de Producción

### Logs en Tiempo Real

```bash
# No hay CLI directo, usar Render Dashboard
# Render Dashboard → Logs (live tail)
```

### Métricas

Render proporciona métricas básicas:

- CPU usage
- Memory usage
- Request count
- Response time

Acceso: Render Dashboard → Metrics

## Troubleshooting en Producción

### Error: "Build Failed"

1. Revisar logs de build en Render
2. Verificar que `package.json` tiene scripts correctos:
    - `"postinstall": "npm run build"`
    - `"build": "cd client && npm install && npm run build"`
3. Verificar que todas las dependencias están en `dependencies`, no solo en `devDependencies`

### Error: "Application Error" o 503

1. Revisar logs del servidor en Render
2. Verificar variables de entorno (especialmente `FIREBASE_SERVICE_ACCOUNT`)
3. Verificar que el puerto está configurado correctamente (Render usa `PORT` env var)

### Error: Login no Funciona en Producción

1. Verificar que OAuth redirect URIs incluyen el dominio de Render
2. Verificar `authDomain` en la configuración de Firebase del cliente
3. Ver solución completa en: `docs/historical/FIREBASE_DOMAIN_SOLUTION.md`

### Error: CORS en Producción

1. Verificar que `CLIENT_ORIGINS` incluye el dominio de Render
2. Verificar que no hay espacios extras en la variable
3. Ejemplo correcto: `https://impostor-game.onrender.com`

## Configuración de Dominio Personalizado

Si quieres usar un dominio personalizado:

1. **En Render**:
    - Ve a Settings → Custom Domain
    - Agrega tu dominio
    - Configura DNS según instrucciones

2. **En Google OAuth**:
    - Agrega el nuevo dominio a Authorized domains
    - Agrega redirect URI: `https://tu-dominio.com/__/auth/handler`

3. **En Variables de Entorno**:
    - Actualiza `CLIENT_ORIGINS` para incluir el nuevo dominio

## Checklist Pre-Deployment

Antes de hacer push a `main`:

- [ ] Código testeado localmente (smoke test completo)
- [ ] No hay credenciales hardcodeadas
- [ ] No se modificaron invariantes críticas (ver `.agent/rules/critical-invariants.md`)
- [ ] Build local exitoso: `cd client && npm run build`
- [ ] Tests automatizados pasan: `npm test` (si aplica)
- [ ] Cambios documentados en commit message
- [ ] Revisión de código (si es cambio crítico)

## Referencias

- Configuración de Render: `render.yaml`
- Variables de entorno: `.env.example` (crear si no existe)
- Guía de mantenimiento: `MAINTAINERS_GUIDE.md`
- Invariantes críticas: `.agent/rules/critical-invariants.md`
