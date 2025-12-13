## Objetivo y punto de referencia (NO ROMPER)

Producción funciona correctamente: inicio de sesión con Firebase, asignación de roles, sincronización en tiempo real (Socket.IO) y reconexión. Estas son las invariantes que NO se deben alterar:
- Autenticación: verificación de ID token con Firebase Admin en el servidor.
- Roles: asignación determinística/consistente en el servidor; el cliente no decide roles.
- Sincronización: el servidor es la fuente de verdad; el cliente recibe estado vía eventos Socket.IO; no hay recargas completas de DOM para transicionar estados.
- Reconexion/Gracia: al desconectarse, hay período de gracia y reanudación de estado.

Referencia a conservar:
- Rama: `main` (GitHub)
- Commit base: `271d416`
- Deploy: Render con `autoDeploy: true` (ver `render.yaml`)

## Reglas estrictas (producción)

- No tocar autenticación, roles, sincronización, o contrato de eventos Socket.IO sin aprobación explícita.
- **Idioma**: Español.
- **Reporting Protocol**: Antes de cualquier commit/deploy a `develop` o `main`, **SIEMPRE**:
  1.  Resumir qué se hizo (ficheros tocados y lógica cambiada).
  2.  Explicar por qué soluciona el problema.
  3.  Pedir confirmación explícita para proceder.
- **Paridad**: `main` y `develop` deben mantenerse sincronizados tras validar features.
- **SEPARACIÓN DE BASES DE DATOS**: Staging (`develop`) NUNCA debe conectarse a la base de datos de producción. Debe usar una instancia o colección separada.
- No commitear `.env` ni credenciales. Mantener `.gitignore` tal como está.
- No cambiar `render.yaml` (plan, buildCommand, startCommand) sin aprobación.
- Cualquier cambio debe ser compatible hacia atrás y testeado en local antes de merge.
- **PERSISTENCIA DE DATOS**: `Game.js` utiliza `server/services/db.js` para persistir estado en Firestore.
  - Producción: Colección `games`.
  - Staging/Dev: Colección `dev_games`.
  - Feature Flag: `ENABLE_DB_PERSISTENCE` controla si se escribe o no en la BBDD.

## Requisitos para entorno local

- Node.js >= 18 (probado con Node 22.x). NPM >= 10.
- Git con acceso SSH al repositorio (recomendado).
- Clave de servicio Firebase Admin para un proyecto de desarrollo.

## Instalación limpia (local) sin tocar producción

1) Sincronizar exactamente con remoto (elimina restos locales):
```
git fetch origin
git reset --hard origin/main
git clean -fdx
npm install
```

2) Crear `.env` local (no se commitea). Recomendado usar puertos alternativos si hay otras instancias:
```
NODE_ENV=development
PORT=4000
CLIENT_ORIGINS=http://localhost:5174,http://localhost:4000

# Elige UNA opción de credenciales Firebase (solo local):
# Opción A (recomendada): archivo JSON en la raíz
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Opción B: JSON completo como string (si no usas archivo)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
ENABLE_DB_PERSISTENCE=true # Opcional: para probar guardado en Firestore localmente
```

3) Colocar la clave de servicio Firebase (solo local):
- Guardar el JSON como `firebase-service-account.json` en la raíz del repo.
- Verificar que `.gitignore` excluye ese archivo (ya configurado).

4) Arranque local (dos formas):
- Solo servidor (sirve el build de cliente ya compilado):
```
PORT=4000 NODE_ENV=development npm run dev
```
  - URL: [http://localhost:4000/](http://localhost:4000/)

- Servidor + Vite con hot reload (opcional en otra terminal):
```
cd client && npm run dev -- --port 5174 --strictPort
```
  - URL Vite: [http://localhost:5174/](http://localhost:5174/)

## Política de puertos y múltiples copias locales

- Si ya existe otra instancia (p. ej., en otra carpeta con Windsurf), usa puertos alternativos (4000/5174).
- Comprobar sin matar procesos:
```
lsof -nP -iTCP:3000 -sTCP:LISTEN | cat
lsof -nP -iTCP:5173 -sTCP:LISTEN | cat
```
- Si necesitas liberar un puerto propio, primero identifica proceso y ruta antes de cerrar.

## Variables de entorno (producción vs local)

- Producción (Render) requiere credenciales reales de Firebase (configuradas en el panel). No usar flags de deshabilitado.
- Local debe proporcionar credenciales vía `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_SERVICE_ACCOUNT`.
- `CLIENT_ORIGINS` debe incluir los orígenes del cliente en uso (p. ej., `http://localhost:5174`).

## Contrato de eventos y estado (core, NO alterar)

- El servidor crea y mantiene `Game` y emite estados por jugador vía Socket.IO.
- Eventos críticos (nombres y semántica no deben cambiar sin aprobación):
  - `connection` / `disconnect` con período de gracia.
  - `create-game`, `join-game`, `start-game`, `end-game`, `play-again`, `leave-game`.
  - `game-state` emitido de forma específica para cada jugador.
- El cliente no debe forzar recargas completas; debe reaccionar a los eventos.

## Checklist de validación tras cualquier cambio

Realizar SIEMPRE este smoke test en local (dos navegadores o uno normal + incognito):
1) Login con Google en ambas ventanas.
2) Ventana A: crear partida y verificar `game-state` inicial; rol asignado.
3) Ventana B: unirse con código; verificar rol asignado correctamente.
3b) (Opcional) Verificar que los documentos se crean en Firestore (colección `dev_games`) si `ENABLE_DB_PERSISTENCE=true`.
4) Probar: `start-game`, generación de pistas/turnos, y flujo de impostor.
5) Desconectar B (cerrar pestaña); verificar periodo de gracia y reentrada.
6) Reabrir B; confirmar reanudación de estado correcto.
7) Ventana A: `leave-game`; validar estado de los demás.
8) Revisar consola del servidor: sin errores ni trazas de excepciones.
9) Revisar consola del cliente: sin errores (solo logs informativos).

## Cómo evitar romper lógica de usuarios/roles/sync

- No cambiar estructuras internas del `Game` ni el contrato de eventos sin pruebas y revisión.
- No mover lógica de negocio al cliente.
- Mantener verificación de ID token en el servidor; no simular tokens en prod.
- Si agregas un evento nuevo, no reutilices nombres existentes.
- Añade validaciones en servidor para rechazar acciones de usuarios fuera de la partida.

## Estrategia de resolución si algo se rompe

- Revertir a `origin/main` inmediatamente:
```
git fetch origin && git reset --hard origin/main && git clean -fdx && npm install
```
- Validar smoke test anterior. Solo después investigar y arreglar en rama aparte.
- No forzar push a `main` salvo recuperación urgente y aprobada.

## Render (producción)

- `render.yaml` incluye `autoDeploy: true`. Un push a `main` dispara despliegue.
- Variables obligatorias en Render: credenciales de Firebase y `CLIENT_ORIGINS` apropiados.
- Nunca desplegar a prod sin haber pasado el checklist local y revisión.

## Troubleshooting (local)

- `EADDRINUSE: 3000` → usa `PORT=4000`, verifica puertos con `lsof`.
- `ENOTFOUND metadata.google.internal` → faltan credenciales Firebase locales.
- CORS bloqueado → asegura `CLIENT_ORIGINS` en `.env` incluye el origen del cliente.
- Socket.IO 401/Invalid token → confirma login del cliente y propagación del token.
- `Client build not found` → ejecuta `npm install` (postinstall construye el cliente) o usa Vite.

## Cambios permitidos sin afectar producción

- Documentación (`.md`), scripts de desarrollo, configuración local vía `.env`.
- No introducir flags que alteren comportamiento en producción.

## Resumen operativo

- Servidor local estable: [http://localhost:4000/](http://localhost:4000/)
- Cliente Vite (opcional): [http://localhost:5174/](http://localhost:5174/)
- Mantener `main` estable, validar siempre con el checklist, y no tocar las invariantes core.


