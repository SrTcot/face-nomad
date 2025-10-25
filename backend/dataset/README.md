# Dataset de Trabajadores

Esta carpeta contiene las fotos de referencia de los trabajadores para el reconocimiento facial.

## 📋 Cómo agregar trabajadores manualmente

### Formato de archivos
- **Nombre del archivo**: `Nombre_Del_Trabajador.jpg`
- **Formato**: JPG, JPEG o PNG
- **Ejemplo**: `Juan_Perez.jpg`, `Maria_Lopez.jpg`

### Requisitos de las fotos
1. **Una sola persona** en la foto
2. **Rostro frontal** mirando a la cámara
3. **Buena iluminación** (evitar sombras en el rostro)
4. **Fondo neutro** (preferible pero no obligatorio)
5. **Resolución mínima**: 200x200 píxeles
6. **Expresión neutral** (sin lentes de sol, gorras que cubran el rostro)

### Estructura de archivos
```
backend/dataset/
├── Juan_Perez.jpg
├── Maria_Lopez.jpg
├── Pedro_Gomez.jpg
└── Ana_Martinez.jpg
```

⚠️ **Importante**: 
- Usa guiones bajos `_` en lugar de espacios en los nombres
- Un solo archivo JPG por trabajador
- El nombre del archivo será el nombre mostrado en el sistema

## 🔄 Entrenamiento automático

Cuando agregues o elimines imágenes:
1. Reinicia el servidor backend (workflow "Backend")
2. El modelo LBPH se reentrenará automáticamente
3. Verifica en los logs que el entrenamiento fue exitoso

## ✅ Verificar que funcionó

Puedes verificar cuántos trabajadores están registrados llamando a:
```
GET /api/health
```

La respuesta mostrará:
```json
{
  "status": "ok",
  "trained": true,
  "workers_count": 4
}
```

## 💡 Alternativa: Usar la interfaz web

También puedes registrar trabajadores desde la aplicación web:
1. Abre la app
2. Haz clic en "Nuevo Trabajador"
3. Captura una foto con la cámara
4. Ingresa el nombre
5. El sistema guardará la foto automáticamente en esta carpeta
