#!/bin/bash

# Script para iniciar El Impostor - Full Stack
# Inicia tanto el servidor backend como el frontend

echo "🚀 Iniciando El Impostor..."

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturar Ctrl+C para limpiar procesos
trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "📡 Iniciando servidor backend..."
node server.js &
BACKEND_PID=$!

# Esperar un momento para que el backend se inicie
sleep 2

# Iniciar frontend
echo "🎨 Iniciando servidor frontend..."
cd client
npm run dev &
FRONTEND_PID=$!

# Volver al directorio raíz
cd ..

echo "✅ Servidores iniciados:"
echo "   📡 Backend: http://localhost:3000"
echo "   🎨 Frontend: http://localhost:5173"
echo ""
echo "💡 Presiona Ctrl+C para detener ambos servidores"

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID
