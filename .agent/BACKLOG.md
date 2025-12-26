# Backlog de Funcionalidades

## 🔜 Próximas Funcionalidades

### 1. Abstención Automática para Desconectados
**Prioridad**: Alta  
**Complejidad**: Media

Si un jugador lleva >2 minutos desconectado durante la votación, su voto cuenta como abstención (no vota a nadie) y la partida puede continuar.

#### Implementación
- [ ] Modificar `checkIfAllVoted()` para excluir jugadores con `pendingDisconnect` > 2 min
- [ ] Añadir campo `connected` al estado del jugador enviado al cliente
- [ ] Mostrar indicador visual de "Desconectado" en UI
- [ ] Opcional: Añadir botón de expulsión para el host

---

### 2. Sistema de Estadísticas de Jugador
**Prioridad**: Media  
**Complejidad**: Media

#### Métricas a trackear
- `gamesPlayed` - Total de partidas jugadas
- `gamesWon` - Partidas ganadas
- `timesImpostor` - Veces que fue impostor
- `timesImpostorWon` - Veces que ganó siendo impostor
- `timesCaughtAsImpostor` - Veces pillado como impostor
- `correctVotes` - Votos correctos al impostor
- `wrongVotes` - Votos a inocentes

#### Reconocimientos al final de partida
| Reconocimiento | Criterio |
|----------------|----------|
| 🔍 **Mejor Olfato** | Mayor ratio de votos correctos |
| 🎭 **Maestro del Engaño** | Más rondas sobrevividas como impostor |
| 😅 **Peor Mentiroso** | Pillado más rápido como impostor |
| 🎯 **Peor Detector** | Mayor ratio de votos incorrectos |

#### Tareas
- [ ] Diseñar schema de estadísticas en Firestore
- [ ] Implementar tracking de métricas durante partida
- [ ] Calcular reconocimientos al finalizar partida
- [ ] UI de reconocimientos en pantalla de fin de partida
- [ ] Persistir estadísticas por usuario
- [ ] Implementar merge de estadísticas anónimo → cuenta registrada

---

### 3. Código QR para Compartir Partida
**Prioridad**: Media  
**Complejidad**: Baja

Generar código QR con el enlace de invitación para facilitar compartir la partida en persona (ej: proyector, TV).

#### Implementación
- [ ] Añadir librería `qrcode.react` o similar
- [ ] Botón "Mostrar QR" junto al botón "Copiar enlace"
- [ ] Modal con QR grande y escaneable
- [ ] El QR contiene la URL completa con gameId

---

### 4. Vinculación de Cuenta Anónima
**Prioridad**: Baja  
**Complejidad**: Baja

- [ ] Función `linkWithGoogle()` en useAuth
- [ ] UI para ofrecer vincular cuenta
- [ ] Manejo de conflicto `credential-already-in-use`
- [ ] Solo permitir cuando no hay partida activa

---

### 5. Firebase App Check (Anti-bot)
**Prioridad**: Baja  
**Complejidad**: Media

Protección invisible contra bots y scripts automatizados usando reCAPTCHA v3.

#### Implementación
- [ ] Configurar reCAPTCHA v3 en Google Cloud Console
- [ ] Habilitar App Check en Firebase Console
- [ ] Inicializar App Check en cliente (`firebase.js`)
- [ ] Verificar tokens en servidor (opcional)
