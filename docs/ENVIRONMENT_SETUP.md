# Guía de Configuración de Entornos

Esta guía documenta cómo configurar los 3 entornos independientes del proyecto.

## Arquitectura de Entornos

| Entorno | Rama Git | Servicio Render | Proyecto Firebase | Propósito |
|---------|----------|-----------------|-------------------|-----------|
| **Develop** | `develop` | `impostor-app-develop` | Firebase Dev | Desarrollo activo |
| **Staging** | `staging` | `impostor-app-staging` | Firebase Staging | QA / Pre-producción |
| **Production** | `main` | `impostor-app-production` | Firebase Prod | Usuarios reales |

---

## 1. Configuración de Firebase (3 Proyectos Independientes)

### Crear los 3 Proyectos en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea 3 proyectos (o usa los existentes):
   - `impostor-game-dev`
   - `impostor-game-staging`
   - `impostor-game-prod`

### Para CADA proyecto, habilita:

1. **Authentication** > Sign-in method:
   - Google
   - (Opcional) Email/Password

2. **Firestore Database**:
   - Crear base de datos
   - Región: `europe-west1` (o la más cercana)

3. **Obtener credenciales del cliente** (Web app):
   - Project Settings > Your apps > Web
   - Copia los valores de `firebaseConfig`

4. **Obtener Service Account** (para el servidor):
   - Project Settings > Service accounts
   - Generate new private key
   - Convierte a una línea: `cat firebase-sa.json | jq -c .`

---

## 2. Variables de Entorno por Servicio en Render

### 2.1 Variables para `impostor-app-develop`

| Variable | Dónde obtenerla |
|----------|-----------------|
| `NODE_ENV` | Valor fijo: `development` |
| `PORT` | Opcional (Render lo asigna automáticamente) |
| `CLIENT_ORIGINS` | URL del servicio Render + localhost para desarrollo |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts → Generate new private key → Convertir a una línea JSON |
| `GAME_RECOVERY_HOURS` | Valor fijo: `3` (horas para recuperar partidas) |
| `ENABLE_DB_PERSISTENCE` | Valor fijo: `true` |
| `VITE_APP_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app → `apiKey` |
| `VITE_APP_FIREBASE_AUTH_DOMAIN` | Firebase Console → `authDomain` |
| `VITE_APP_FIREBASE_PROJECT_ID` | Firebase Console → `projectId` |
| `VITE_APP_FIREBASE_STORAGE_BUCKET` | Firebase Console → `storageBucket` |
| `VITE_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → `messagingSenderId` |
| `VITE_APP_FIREBASE_APP_ID` | Firebase Console → `appId` |

### 2.2 Variables para `impostor-app-staging`

Mismas variables que develop, pero obtenidas del proyecto Firebase de **staging**.

### 2.3 Variables para `impostor-app-production`

Mismas variables que develop, pero obtenidas del proyecto Firebase de **producción**.
 |

---

## 3. Configurar Google OAuth para CADA Proyecto Firebase

En [Google Cloud Console](https://console.cloud.google.com/):

### Para cada proyecto, configura:

1. **APIs & Services** > **Credentials** > **OAuth 2.0 Client IDs**
2. Edita el Web client
3. En **Authorized redirect URIs**, añade:
   - **Dev**: `https://impostor-app-develop.onrender.com/__/auth/handler`
   - **Staging**: `https://impostor-app-staging.onrender.com/__/auth/handler`
   - **Prod**: `https://impostor-app-production.onrender.com/__/auth/handler`

4. En **Authorized JavaScript origins**, añade:
   - **Dev**: `https://impostor-app-develop.onrender.com`
   - **Staging**: `https://impostor-app-staging.onrender.com`
   - **Prod**: `https://impostor-app-production.onrender.com`

---

## 4. Sincronización de Ramas Git

### Estado actual
- `develop`: Rama principal de desarrollo (fuente de verdad)
- `staging`: Debe sincronizarse con develop para pruebas
- `main`: Solo recibe código probado en staging

### Comandos para sincronizar staging con develop

```bash
# 1. Asegúrate de estar actualizado
git fetch origin

# 2. Checkout a staging
git checkout staging

# 3. Merge develop en staging
git merge origin/develop --no-ff -m "Sync staging with develop"

# 4. Push staging (TÚ ejecutas esto)
git push origin staging
```

### Flujo recomendado para releases

```
develop → staging → main
    ↓         ↓        ↓
  (dev)     (QA)    (prod)
```

1. Desarrollo en `develop`
2. Cuando está listo para testing: `staging ← develop`
3. Cuando está aprobado: `main ← staging`

---

## 5. Verificación del Blueprint en Render

### Cómo sincronizar el Blueprint

1. Ve a **Render Dashboard** > **Blueprints**
2. Si el Blueprint actual no refleja los 3 servicios:
   - Click en "Sync Blueprint"
   - Esto leerá el `render.yaml` actualizado

3. Verifica que cada servicio:
   - Está conectado a la rama correcta
   - Tiene `autoDeploy: true`
   - Tiene las variables de entorno configuradas

---

## 6. Checklist de Configuración

### Develop
- [ ] Proyecto Firebase creado
- [ ] Variables de entorno en Render configuradas
- [ ] OAuth redirect URIs configurados
- [ ] Deploy funciona correctamente
- [ ] Login con Google funciona

### Staging
- [ ] Proyecto Firebase creado
- [ ] Variables de entorno en Render configuradas
- [ ] OAuth redirect URIs configurados
- [ ] Rama `staging` sincronizada con `develop`
- [ ] Deploy funciona correctamente
- [ ] Login con Google funciona

### Production
- [ ] Proyecto Firebase creado (probablemente ya existe)
- [ ] Variables de entorno en Render configuradas
- [ ] OAuth redirect URIs configurados
- [ ] Rama `main` actualizada
- [ ] Deploy funciona correctamente
- [ ] Login con Google funciona
