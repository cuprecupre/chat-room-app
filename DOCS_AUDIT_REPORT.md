# Auditoría de Documentación

## Resumen
Se revisaron 12 archivos de documentación `.md`. La mayoría de la documentación técnica en `docs/` es relevante y valiosa. Sin embargo, el `README.md` principal contiene instrucciones incorrectas sobre la estructura del proyecto y scripts de inicio.

## 🔴 Obsoleto / Incorrecto (Acción Requerida)

### 1. `README.md` (Raíz)
- **Estado:** ⚠️ **DESACTUALIZADO**
- **Problemas:**
    - Menciona `./start.sh` como método de inicio, pero **el archivo no existe**.
    - Describe la estructura como `client/` y `server.js` en raíz. La estructura real es un monorepo: `apps/client` y `apps/server`.
    - Los comandos de instalación manual (`cd client`) no reflejan la estructura actual.
- **Recomendación:** Actualizar con los comandos correctos para el monorepo (probablemente usando `npm start` desde raíz o scripts de turbo/workspaces).

### 2. `apps/client/README.md`
- **Estado:** 🗑️ **BASURA**
- **Problemas:** Es el template por defecto de Vite ("React + Vite"). No aporta valor específico al proyecto.
- **Recomendación:** Eliminar.

## 🟢 Vigente y Valioso (Conservar)

### Documentación de Raíz
- **`CONTRIBUTING.md`**: Describe correctamente el flujo Git (Main/Develop) y despliegue. **Conservar**.
- **`AI_RULES.md`**: Protocolo crítico para agentes. **Conservar**.
- **`BACKLOG_REFACTOR.md`**: Recién creado, contiene deuda técnica actual. **Conservar**.

### Carpeta `docs/`
- **`ENVIRONMENT_SETUP.md`**: Guía detallada de Firebase/Render. Muy valiosa. **Conservar**.
- **`WORDS_GUIDE.md`**: Guía para contenido (palabras). **Conservar**.
- **`COPYWRITING_GUIDELINES.md`**: Guía de estilo. **Conservar**.
- **`GOOGLE_LOGIN_FIX.md` y `FIREBASE_DOMAIN_SOLUTION.md`**: "Post-mortems" técnicos y soluciones a problemas complejos. Muy útiles para debugging futuro. **Conservar**.
- **`IMPROVEMENTS_ROADMAP.md`**: Lista de tareas futuras. **Conservar**.

## 🟡 Archivo (Histórico)
- **`docs/CHANGELOG_2025-12-17_scoring.md`**: Registro histórico de cambios de reglas. No molesta, sirve de referencia. **Conservar**.
