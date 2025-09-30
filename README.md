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

1. **Crear/Unirse**: Crea una nueva partida o únete con un código
2. **Invitar amigos**: Comparte el enlace o código de la sala
3. **Jugar**: Descubre quién es el impostor basándote en las pistas

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