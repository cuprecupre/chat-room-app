# El Impostor

Un juego multijugador en tiempo real donde los jugadores intentan descubrir quién es el impostor.

## 🚀 Inicio Rápido

El proyecto utiliza **Turbo Repo** para gestión de monorepo.

### Comandos Principales

```bash
# Instalar dependencias (Raíz)
npm install

# Iniciar entorno de desarrollo (Cliente + Servidor en paralelo)
npm run dev

# Ejecutar tests del servidor
npm test
```

El servidor utiliza el puerto **3000** y el cliente (Vite) el puerto **5173**.

## 🎮 Cómo Jugar

### Inicio del Juego

1. **Crear/Unirse**: Crea una nueva partida o únete con un código
2. **Invitar amigos**: Comparte el enlace o código de la sala
3. **Orden de jugadores**: Los jugadores se ordenan por orden de llegada

### Mecánica del Juego

1. **Reparto de roles**:
    - Un jugador es **impostor** (no conoce la palabra secreta, solo categoría).
    - Los demás son **amigos** (conocen la palabra secreta).

2. **Rondas de conversación**:
    - Cada jugador da una pista sobre la palabra.
    - El impostor debe disimular.

3. **Votaciones**:
    - Se vota para eliminar al sospechoso.
    - Si expulsan al impostor: **Los amigos ganan**.
    - Si el impostor sobrevive 3 rondas o queda solo con 1 amigo: **El impostor gana**.

## 📁 Estructura del Proyecto

Este proyecto es un Monorepo con la siguiente estructura:

```
├── apps/
│   ├── client/          # Frontend (React + Vite + Tailwind)
│   └── server/          # Backend (Node.js + Socket.io + Express)
├── docs/                # Documentación técnica detallada
├── package.json         # Scripts de raíz (Turbo)
└── render.yaml          # Configuración de despliegue (Render)
```

## 🔧 Tecnologías

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Socket.IO, Express.
- **Base de Datos**: Firestore (persistencia), In-Memory (estado de juego activo).
- **Gestión**: Turbo Repo.

## 📚 Documentación

Para más detalles técnicos, consulta la carpeta `docs/`.
- [Configuración de Entornos](docs/ENVIRONMENT_SETUP.md)
- [Guía de Palabras](docs/WORDS_GUIDE.md) (para añadir nuevas categorías)
- [Reglas para IA](AI_RULES.md)

## 🚀 Deploy

El proyecto se despliega automáticamente en Render.com con 3 entornos:
- `develop` (Staging/Dev)
- `main` (Producción)
