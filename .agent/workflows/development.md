---
description: Workflow de desarrollo local
---

# Workflow de Desarrollo Local

Este workflow describe cómo configurar e iniciar el entorno de desarrollo local del proyecto "El Impostor".

## Prerequisitos

- Node.js >= 18 (probado con Node 22.x)
- NPM >= 10
- Git con acceso al repositorio
- Credenciales de Firebase Admin para desarrollo

## 1. Clonar el Repositorio (si es primera vez)

```bash
git clone <repository-url>
cd impostor\ v2
```

## 2. Sincronizar con la Rama Principal

Antes de empezar cualquier trabajo, sincroniza con `origin/main`:

```bash
git fetch origin
git reset --hard origin/main
git clean -fdx
```

⚠️ **ADVERTENCIA**: Esto eliminará cambios locales no commiteados.

## 3. Instalar Dependencias

```bash
# Instalar dependencias del servidor (incluye build del cliente via postinstall)
npm install

# Si necesitas trabajar con Vite en desarrollo:
cd client
npm install
cd ..
```

## 4. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# .env
NODE_ENV=development
PORT=4000
CLIENT_ORIGINS=http://localhost:5174,http://localhost:4000

# Credenciales Firebase - Opción A (recomendada)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Credenciales Firebase - Opción B (alternativa)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto
3. Ve a Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Guarda el archivo JSON como `firebase-service-account.json` en la raíz

⚠️ **IMPORTANTE**: Este archivo NO debe commitearse (ya está en `.gitignore`).

## 5. Iniciar el Servidor

### Opción A: Script Automático (Recomendado)

Inicia servidor backend + cliente Vite con hot reload:

// turbo
```bash
./start.sh
```

Este script:
- Inicia el servidor backend en puerto 3000 (o PORT desde .env)
- Inicia Vite dev server en puerto 5173
- Ambos corren concurrentemente con logs coloreados

### Opción B: Solo Backend

Si solo necesitas el servidor (sirve el build estático):

```bash
PORT=4000 NODE_ENV=development npm run dev
```

Acceso: http://localhost:4000/

### Opción C: Backend + Vite por Separado

Terminal 1 (Backend):
```bash
PORT=4000 npm run dev
```

Terminal 2 (Frontend con hot reload):
```bash
cd client
npm run dev -- --port 5174 --strictPort
```

Acceso: http://localhost:5174/ (Vite con hot reload)

## 6. Verificar que Todo Funciona

Abre http://localhost:5173 (o el puerto que corresponda) y verifica:

✅ La página carga sin errores en consola
✅ Aparece la pantalla de login
✅ No hay errores de Firebase en la consola del servidor
✅ No hay errores de CORS

## 7. Realizar Cambios

### Desarrollo de Frontend

- Los archivos están en `client/src/`
- Con Vite dev server, los cambios se reflejan automáticamente (hot reload)
- Los componentes principales:
  - `App.jsx` - Componente principal y routing
  - `components/` - Componentes de UI
  - `hooks/` - React hooks personalizados
  - `lib/` - Utilidades y configuración (Firebase)

### Desarrollo de Backend

- Archivos principales:
  - `server.js` - Servidor Express + Socket.IO
  - `Game.js` - Lógica del juego
  - `words.js` - Palabras del juego
- Reiniciar el servidor manualmente tras cambios (no hay hot reload en backend)

## 8. Testing Durante Desarrollo

Ejecutar smoke test básico:

1. Abrir dos ventanas del navegador (normal + incógnito)
2. Login con Google en ambas
3. Ventana A: crear partida
4. Ventana B: unirse con código
5. Iniciar juego y verificar roles
6. Probar votación
7. Desconectar/reconectar

Ver más detalles en: `.agent/workflows/testing.md`

## 9. Verificar Puertos en Uso

Si obtienes error `EADDRINUSE`:

```bash
# Ver qué proceso usa el puerto
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN

# Cambiar puerto en .env si es necesario
PORT=4000
```

## 10. Detener el Servidor

Si usaste `start.sh`:

```bash
./stop.sh
```

O manualmente:
- `Ctrl + C` en cada terminal
- Verificar que no quedan procesos: `lsof -nP -iTCP:3000 -sTCP:LISTEN`

## Troubleshooting Común

### Error: "Client build not found"

```bash
cd client
npm install
npm run build
cd ..
```

### Error: "ENOTFOUND metadata.google.internal"

Faltan credenciales de Firebase. Verifica `.env` y archivo JSON.

### Error: CORS bloqueado

Asegura que `CLIENT_ORIGINS` en `.env` incluye el origen correcto (ej: `http://localhost:5173`).

### Error: Socket.IO 401/Invalid token

- Confirma que el login funciona en el cliente
- Verifica que el token se propaga correctamente
- Revisa logs del servidor para ver el error exacto

## Referencias

- Guía completa de troubleshooting: `.agent/workflows/troubleshooting.md`
- Invariantes críticas: `.agent/rules/critical-invariants.md`
- Guía de mantenimiento: `MAINTAINERS_GUIDE.md`
