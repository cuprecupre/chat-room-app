# API Stats Endpoint

## Endpoint
`GET /api/stats`

## Respuesta
```json
{
  "connectedUsers": 5,
  "activeGames": 2,
  "totalConnections": 150,
  "gamesCreated": 45,
  "peakConcurrentUsers": 23,
  "serverUptime": 3600,
  "timestamp": 1702789200000
}
```

## Campos

| Campo | Descripción |
|-------|-------------|
| `connectedUsers` | Usuarios **logueados** con socket activo (tiempo real) |
| `activeGames` | Partidas en memoria (tiempo real) |
| `totalConnections` | Total conexiones desde inicio del servidor |
| `gamesCreated` | Total partidas creadas desde inicio del servidor |
| `peakConcurrentUsers` | Máximo usuarios simultáneos (pico) |
| `serverUptime` | Segundos desde inicio del servidor |
| `timestamp` | Timestamp Unix de la consulta |

## Persistencia en Firestore

Cada **5 minutos** se guarda un resumen diario en:
```
Collection: stats
Document: {YYYY-MM-DD}
```

Esto permite consultar estadísticas históricas sin saturar Firestore.

## Notas
- Solo usuarios autenticados cuentan (requieren token Firebase válido).
- Visitas anónimas no se trackean (usar Google Analytics para eso).
- Valores se resetean al reiniciar servidor, pero Firestore mantiene histórico.
