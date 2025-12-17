# Changelog: Reglas de Juego y Puntuación

## Fecha: 2025-12-17

Este documento describe los cambios realizados a la lógica de juego y puntuación del Impostor. Úsalo como referencia si necesitas reimplementar estos cambios en otra rama.

---

## 1. Auto-Win cuando quedan 2 jugadores

### Problema
Cuando solo quedaban 2 jugadores (impostor + 1 amigo) después de una eliminación, el juego continuaba con vueltas de empate que eran imposibles de ganar para el amigo.

### Solución
Después de eliminar a un amigo, verificar si solo quedan 2 jugadores. Si es así, el impostor gana automáticamente.

### Archivo: `Game.js`
### Ubicación: Método `processVotingResults`, después de verificar que el eliminado NO era el impostor

```javascript
// Era un amigo, verificar cuántos quedan
const activePlayers = this.getActivePlayers();

// Si solo quedan 2 jugadores (impostor + 1 amigo), el impostor gana automáticamente
if (activePlayers.length <= 2) {
  console.log(`[Game ${this.gameId}] Solo quedan 2 jugadores. ¡El impostor gana automáticamente!`);
  this.endRound(false); // Impostor gana
} else if (this.currentTurn >= this.maxTurns) {
  // ... código existente
}
```

### Comportamiento
- **Partida de 2 jugadores desde el inicio:** Se juegan las 3 vueltas (empates), impostor gana al final.
- **Quedan 2 por eliminación:** Impostor gana inmediatamente sin más votaciones.

---

## 2. Puntos del Impostor al ganar la ronda

### Problema
Cuando el impostor ganaba (por llegar a vuelta 3 o por quedar solo 2 jugadores), los puntos se asignaban ANTES de llamar a `calculateRoundScores`, pero esa función reseteaba `lastRoundScores = {}`, borrando los puntos de la UI.

### Solución
Mover la asignación de puntos del impostor DENTRO de `calculateRoundScores`, después del reset.

### Archivo: `Game.js`
### Ubicación: Método `calculateRoundScores`, dentro del bloque `else` (cuando `friendsWon === false`)

```javascript
} else {
  // Impostor ganó
  // Dar puntos finales al impostor por ganar la ronda
  const finalTurnPoints = this.currentTurn + 1; // V1=2, V2=3, V3=4
  this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + finalTurnPoints;
  this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + finalTurnPoints;
  console.log(`[Game ${this.gameId}] Impostor gana la ronda en vuelta ${this.currentTurn}: +${finalTurnPoints} puntos`);

  // Dar puntos a amigos que votaron correctamente (aunque no ganaron)
  this.turnHistory.forEach(turn => {
    Object.entries(turn.votes).forEach(([voter, target]) => {
      if (target === this.impostorId && voter !== this.impostorId) {
        this.playerScores[voter] = (this.playerScores[voter] || 0) + 1;
        this.lastRoundScores[voter] = (this.lastRoundScores[voter] || 0) + 1;
      }
    });
  });
}
```

### Puntuación del Impostor (Reglas finales)
| Situación | Puntos |
|-----------|--------|
| Gana en Vuelta 1 (amigo eliminado, quedan 2) | +2 pts |
| Gana en Vuelta 2 (amigo eliminado, quedan 2) | +3 pts |
| Gana en Vuelta 3 (amigo eliminado o empate) | +4 pts |
| Empates en vueltas intermedias | 0 pts |

---

## 3. Indicador "Eliminado" en puntuación parcial

### Problema
En la pantalla de "Puntuación parcial" (`round_result`), no se mostraba qué jugadores habían sido eliminados durante la ronda.

### Solución
Añadir texto "Eliminado" debajo del nombre del jugador cuando `isRoundResult && isEliminated`.

### Archivo: `client/src/components/GameRoom.jsx`
### Ubicación: Dentro del componente `PlayerList`, en el render del nombre

```jsx
<div className="flex flex-col">
  <span className={`font-medium ${isWinner ? 'text-orange-400' : ''}`}>
    {p.name}{p.uid === currentUserId ? ' (Tú)' : ''}
  </span>
  {/* Indicador de eliminado en vista de puntuación */}
  {isRoundResult && isEliminated && (
    <span className="text-xs text-red-400 font-medium">Eliminado</span>
  )}
</div>
```

### Notas
- Solo se muestra en `round_result`, NO en `game_over` (resultados finales).
- El indicador aparece debajo del nombre, no a la derecha.

---

## Resumen de Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `Game.js` | Auto-win con 2 jugadores, puntos impostor en `calculateRoundScores` |
| `client/src/components/GameRoom.jsx` | Indicador "Eliminado" en puntuación parcial |

---

## Testing

Para verificar que los cambios funcionan:

1. **Auto-win con 2 jugadores:**
   - Crear partida con 3 jugadores
   - Eliminar a un amigo (no al impostor)
   - Verificar que el impostor gana automáticamente

2. **Puntos del impostor:**
   - Crear partida con 2 jugadores
   - Empatar las 3 vueltas
   - Verificar que el impostor muestra "+4 pts" (no "0 pts")

3. **Indicador eliminado:**
   - Jugar una ronda donde alguien sea eliminado
   - En la pantalla de puntuación parcial, verificar que aparece "Eliminado"
