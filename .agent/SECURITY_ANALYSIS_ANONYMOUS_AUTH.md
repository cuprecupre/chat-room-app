# Análisis de Seguridad: Autenticación Anónima

## Resumen Ejecutivo

✅ **La implementación es SEGURA** - Los usuarios anónimos pasan por el mismo proceso de validación que los usuarios Google/Email.

## Arquitectura de Seguridad Actual

```
Cliente                              Servidor
   │                                    │
   ├─ signInAnonymously() ────────────> Firebase Auth
   │                                    │
   │ <────── ID Token (JWT) ────────────┤
   │                                    │
   ├─ Socket connect + token ─────────> │
   │                                    ├─ admin.auth().verifyIdToken(token)
   │                                    │  ↓
   │                                    ├─ Token válido? → Permite conexión
   │                                    ├─ Token inválido? → Rechaza (401)
```

## Puntos de Seguridad Verificados

### ✅ 1. Autenticación en Socket

```javascript
// middleware/auth.js línea 39
const decodedToken = await admin.auth().verifyIdToken(token);
```

- **Todos** los usuarios (Google, Email, Anónimo) pasan por esta validación
- Firebase Admin SDK verifica la firma criptográfica del token
- No es posible falsificar un token sin acceso a las claves privadas de Firebase

### ✅ 2. Autenticación en API REST

```javascript
// middleware/auth.js línea 13
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

- Los endpoints HTTP también validan tokens

### ✅ 3. No hay bypass

- Los usuarios anónimos **NO evitan** ningún middleware
- El UID de Firebase es tan seguro para anónimos como para usuarios registrados

## Vectores de Ataque Analizados

| Vector                   | Riesgo  | Mitigación Existente                      |
| ------------------------ | ------- | ----------------------------------------- |
| **Token falso**          | Ninguno | Firebase valida firma criptográfica       |
| **Token expirado**       | Ninguno | Firebase rechaza tokens expirados         |
| **Suplantación de UID**  | Ninguno | UID viene del token, no del cliente       |
| **Múltiples conexiones** | Bajo    | `session-replaced` cierra sesión anterior |
| **Flood de cuentas**     | Medio   | ⚠️ Ver recomendaciones                    |
| **Nombres ofensivos**    | Medio   | ⚠️ Ver recomendaciones                    |

## ⚠️ Riesgos Reales (No de la implementación, sino del modelo)

### 1. Abuso de Cuota de Firebase Auth

**Problema**: Alguien podría crear miles de cuentas anónimas.
**Impacto**: Costo de Firebase, datos basura.
**Mitigación**:

- Firebase tiene límites automáticos (100 cuentas/IP/hora)
- Cloud Function para limpiar anónimos viejos

### 2. Denegación de Servicio (DoS)

**Problema**: Crear muchas partidas con cuentas desechables.
**Impacto**: Recursos del servidor.
**Mitigación actual**:

- Límite existente de partidas
- Cada conexión requiere token válido de Firebase

### 3. Spam de nombres

**Problema**: Nombres ofensivos o repetitivos.
**Impacto**: UX, reputación.
**Mitigación sugerida**:

- Filtro de palabras prohibidas
- Rate limit por IP

## Comparación: Anónimo vs Google

| Aspecto                     | Google Auth | Anonymous Auth     |
| --------------------------- | ----------- | ------------------ |
| Token validado por Firebase | ✅          | ✅                 |
| UID único garantizado       | ✅          | ✅                 |
| Socket autenticado          | ✅          | ✅                 |
| Email para contacto         | ✅          | ❌                 |
| Foto de perfil              | ✅          | ❌ (usa iniciales) |

## Conclusión

La funcionalidad de anónimos **NO introduce vulnerabilidades nuevas** porque:

1. Usa el mismo flujo de autenticación
2. Los tokens son validados por Firebase Admin SDK
3. El servidor nunca confía en datos del cliente sin verificar

Los únicos riesgos son de **abuso** (no de seguridad), que son manejables con rate limiting y limpiezas periódicas.

## Recomendaciones Opcionales

1. **Filtro de palabras** - Para nombres ofensivos
2. **Limpieza mensual** - Cloud Function para eliminar anónimos sin actividad >30 días
3. **Monitoreo** - Alertas si hay picos de creación de cuentas anónimas
