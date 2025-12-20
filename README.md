# El Impostor

Un juego multijugador en tiempo real donde los jugadores intentan descubrir quién es el impostor.

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
./start.sh
```

### Opción 2: Manual (2 terminales)

```bash
# Terminal 1 - Backend
node server.js

# Terminal 2 - Frontend
cd client
npm run dev
```

## 🎮 Cómo Jugar

### Inicio del Juego

1. **Crear/Unirse**: Crea una nueva partida o únete con un código
2. **Invitar amigos**: Comparte el enlace o código de la sala
3. **Orden de jugadores**: Los jugadores se ordenan por orden de llegada

### Sistema de Orden y Turnos

El juego mantiene un **orden base** determinado por el momento en que cada jugador se unió a la partida:

- **Orden base**: Inmutable (salvo altas/bajas de jugadores)
- **Jugador inicial**: Rota en cada ronda siguiendo el orden
    - Ronda 1: Empieza el primer jugador que se unió
    - Ronda 2: Empieza el segundo jugador
    - Ronda 3: Empieza el tercer jugador, y así sucesivamente
- **Indicador visual**: Un icono 🎯 marca al jugador que debe iniciar cada ronda
- **Lista de jugadores**: Se muestra ordenada con el jugador inicial siempre en la posición 1º

### Mecánica del Juego

1. **Reparto de roles**:
    - Un jugador es seleccionado aleatoriamente como **impostor**
    - Los demás son **amigos** y reciben la palabra secreta
    - El impostor solo recibe una pista sobre la categoría

2. **Rondas de conversación**:
    - El jugador inicial empieza la ronda (presencial)
    - Cada jugador da pistas sobre la palabra
    - El impostor debe disimular sin conocer la palabra exacta

3. **Votaciones** (3 vueltas):
    - **Vuelta 1, 2 y 3**: Los jugadores votan para eliminar al sospechoso
    - Los jugadores eliminados no pueden votar en siguientes vueltas
    - Si hay empate, se pasa a la siguiente vuelta sin eliminación
    - Si eliminan al impostor: **Los amigos ganan**
    - Si no lo eliminan en 3 vueltas: **El impostor gana**

4. **Puntuación**:
    - Amigos: +1 punto por votar correctamente al impostor
    - Amigos: +1 punto adicional si expulsan al impostor
    - Impostor: +2 puntos por sobrevivir la vuelta 1
    - Impostor: +3 puntos por sobrevivir la vuelta 2
    - Impostor: +4 puntos por sobrevivir la vuelta 3
    - El juego continúa hasta que un jugador alcance **15 puntos** o se completen **3 partidas**

### Reconexión y Desconexiones

- **Período de gracia**: Los jugadores desconectados tienen tiempo para reconectarse
- **Reentrada automática**: Al reconectar, se restaura el estado del juego
- Si un jugador abandona definitivamente, se actualiza el orden base

## 🛠️ Desarrollo

### Instalación

```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client
npm install
```

### Scripts Disponibles

- `./start.sh` - Inicia ambos servidores automáticamente
- `node server.js` - Solo servidor backend
- `cd client && npm run dev` - Solo servidor frontend

## 📁 Estructura

```
├── client/          # Frontend (React + Vite)
├── server.js        # Backend (Node.js + Socket.io)
├── Game.js          # Lógica del juego
├── words.js         # Palabras del juego
└── start.sh         # Script de inicio automático
```

## 🔧 Tecnologías

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Socket.io
- **Autenticación**: Firebase Auth
- **Real-time**: WebSockets
- **Deploy**: Render.com

## 📱 Características

- ✅ Juego multijugador en tiempo real
- ✅ Autenticación con Google
- ✅ Responsive design
- ✅ Optimizado para móviles
- ✅ Service Worker para cache
- ✅ Indicadores de estado de jugadores

## 🚀 Deploy

El proyecto se despliega automáticamente en Render.com cuando se hace push a la rama `main`.
