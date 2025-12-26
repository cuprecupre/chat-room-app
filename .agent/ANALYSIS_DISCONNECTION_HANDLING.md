# Análisis: Manejo de Desconexiones en Partidas

## Resumen Ejecutivo

⚠️ **PROBLEMA IDENTIFICADO**: Durante el período de gracia (1-5 min), la partida **SÍ queda bloqueada** esperando el voto del jugador desconectado.

## Flujo Actual de Desconexión

```
Jugador se desconecta
        ↓
Grace Period Timer inicia
(5 min si estaba activo, 1 min si inactivo)
        ↓
Durante este período:
- Jugador SIGUE en game.players
- Jugador SIGUE en game.roundPlayers
- getActivePlayers() LO INCLUYE
- checkIfAllVoted() ESPERA SU VOTO  ← ⚠️ BLOQUEO
        ↓
Timer expira → removePlayer()
        ↓
Después de removePlayer():
- Se elimina de game.players
- Se elimina de game.roundPlayers
- Se elimina su voto (delete game.votes[userId])
- checkIfAllVoted() ya NO lo considera
```

## Escenarios y Comportamiento Actual

| Escenario                | Tiempo           | ¿Bloquea votación?    |
| ------------------------ | ---------------- | --------------------- |
| **Bloquear móvil 10s**   | Reconecta        | No                    |
| **Bloquear móvil 2 min** | Dentro del grace | **SÍ - BLOQUEA**      |
| **Cerrar pestaña**       | 1-5 min grace    | **SÍ - BLOQUEA**      |
| **Perder WiFi 30s**      | Reconecta        | No                    |
| **Perder WiFi 3 min**    | Dentro del grace | **SÍ - BLOQUEA**      |
| **Grace period expira**  | Después          | No - jugador removido |

## Código Relevante

### VotingManager.js - checkIfAllVoted

```javascript
function checkIfAllVoted(game) {
    const activePlayers = getActivePlayers(game); // ← Incluye desconectados
    const votedPlayers = Object.keys(game.votes).filter((uid) => activePlayers.includes(uid));

    if (votedPlayers.length === activePlayers.length) {
        // ← Espera a TODOS
        processVotingResults(game);
        return true;
    }
    return false;
}
```

### PlayerManager.js - getActivePlayers

```javascript
function getActivePlayers(game) {
    // Solo filtra eliminados, NO filtra desconectados
    return game.roundPlayers.filter((uid) => !game.eliminatedInRound.includes(uid));
}
```

### socketHandlers.js - Grace Period

```javascript
const MOBILE_GRACE_PERIOD = 300000; // 5 minutos
const INACTIVE_GRACE_PERIOD = 60000; // 1 minuto
```

## Opciones de Solución

### Opción A: Reducir Grace Period (Mínimo cambio)

- Cambiar a 30-60 segundos máximo
- **Pro**: Fácil de implementar
- **Contra**: Usuarios con mala conexión pueden ser expulsados

### Opción B: Votos Automáticos para Desconectados (Recomendado)

- Al iniciar votación, dar timeout de ~30s
- Si desconectado no vota, asignar voto aleatorio o abstención
- **Pro**: Partida nunca se bloquea
- **Contra**: El jugador desconectado pierde agencia

### Opción C: Tracking de Estado de Conexión

- Añadir `connected: true/false` al objeto player
- `getActivePlayers()` filtra desconectados
- **Pro**: Solución limpia
- **Contra**: Requiere refactor de varios componentes

### Opción D: Timeout de Votación

- Añadir timer por turno (ej: 60 segundos)
- Al expirar, procesar votos actuales ignorando ausentes
- **Pro**: UX clara con countdown visible
- **Contra**: Cambio significativo en mecánica de juego

## Recomendación

**Implementar Opción D (Timeout de Votación)** porque:

1. Da experiencia de usuario clara (countdown visible)
2. No expulsa jugadores prematuramente
3. Resuelve el problema de bloqueo
4. Es un patrón común en juegos multijugador

## Persistencia en Firestore

La persistencia NO afecta este problema porque:

- Los datos se guardan solo en cambios de fase importantes
- El estado en memoria es el que controla la votación
- Si el servidor se reinicia, todas las partidas se pierden de todas formas
