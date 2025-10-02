#!/bin/bash

echo "🛑 Deteniendo todos los servidores..."

# Matar proceso en puerto 3000 (backend)
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "  ⏹️  Deteniendo backend (puerto 3000)..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  echo "  ✅ Backend detenido"
else
  echo "  ℹ️  Backend no está corriendo"
fi

# Matar proceso en puerto 5173 (frontend)
if lsof -ti:5173 > /dev/null 2>&1; then
  echo "  ⏹️  Deteniendo frontend (puerto 5173)..."
  lsof -ti:5173 | xargs kill -9 2>/dev/null
  echo "  ✅ Frontend detenido"
else
  echo "  ℹ️  Frontend no está corriendo"
fi

echo ""
echo "✅ Todos los servidores han sido detenidos"

