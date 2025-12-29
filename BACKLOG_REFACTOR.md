# Backlog de Refactorización y Arquitectura

## Objetivo
Mejorar la mantenibilidad, escalabilidad y la eficiencia de la IA en el proyecto mediante la reestructuración de componentes clave.

## Recomendaciones Prioritarias

### 1. Dividir `socketHandlers.js` (Alta Prioridad)
**Problema**: El archivo `apps/server/src/handlers/socketHandlers.js` es monolítico y maneja demasiadas responsabilidades (conexión, juego, chat, votación).
**Solución**:
- Crear carpeta `apps/server/src/handlers/`
- Dividir en:
    - `gameHandlers.js`: `start-game`, `next-round`, `end-game`.
    - `lobbyHandlers.js`: `create-game`, `join-game`, `leave-game`.
    - `voteHandlers.js`: `cast-vote`.
    - `connectionHandlers.js`: `disconnect`, `reconnection`.

### 2. Desacoplar `Game.js` (Media Prioridad)
**Problema**: La clase `Game` viola el Principio de Responsabilidad Única al manejar persistencia y migración.
**Solución**:
- **Servicio de Persistencia**: Mover lógica de `persist()` y debounce a `PersistenceManager.js`.
- **Servicio de Migración**: Mover lógica de `fromState` y detección de versiones a `GameMigrator.js`.

### 3. Modularizar Hooks del Cliente (Media Prioridad)
**Problema**: `useSocket.js` es un "objeto dios" que centraliza toda la lógica de eventos del cliente.
**Solución**:
- Crear hooks específicos por dominio:
    - `useLobbySocket`: Eventos de unión y sala de espera.
    - `useGameSocket`: Eventos de la partida en curso.
    - `useChatSocket`: (Si aplica) Eventos de chat.

### 4. Contrato de API Compartido (Baja Prioridad / Mejora DX)
**Problema**: Strings "mágicos" para eventos (`"join-game"`) y fases (`"playing"`) duplicados en cliente y servidor.
**Solución**:
- Crear archivo de constantes compartido (ej: `shared/constants.js` o en ambos lados si no hay monorepo tool).
- Unificar nombres de eventos para evitar errores de tipografía.

## Estado Actual
- **Refactorización de UI**: Completada (`GameRoom.jsx` dividido en componentes).
- **Tests**: Cobertura básica de servidor y componentes nuevos de cliente implementada.

---
*Generado automáticamente por Asistente de IA basado en análisis estático del código.*
