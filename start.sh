#!/bin/bash
set -e

echo "🚀 Iniciando FaceNomad - Deployment en Producción"

# Obtener el directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 Directorio de trabajo: $SCRIPT_DIR"

# Build del frontend
echo "🏗️  Compilando frontend React..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: El directorio dist/ no fue creado"
    exit 1
fi

echo "✅ Frontend compilado exitosamente en dist/"

# Iniciar Flask que servirá tanto frontend como backend
echo "🚀 Iniciando servidor Flask en puerto 5000..."
cd backend
PORT=5000 python app.py &
FLASK_PID=$!

echo "✅ Servidor iniciado (PID: $FLASK_PID)"
echo "   - Frontend: http://localhost:5000"
echo "   - API: http://localhost:5000/api"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidor..."
    kill $FLASK_PID 2>/dev/null || true
    wait $FLASK_PID 2>/dev/null || true
    echo "✅ Servidor detenido"
    exit 0
}

# Capturar señales de terminación
trap cleanup SIGTERM SIGINT EXIT

# Esperar a que el proceso termine
wait $FLASK_PID
