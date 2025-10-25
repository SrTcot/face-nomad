# FaceNomad v1.6.0

![FaceNomad Logo](https://img.shields.io/badge/FaceNomad-v1.6.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-blue)

## 📋 Descripción

**FaceNomad** es un sistema de reconocimiento facial biométrico diseñado para el control de asistencia de trabajadores en entornos rurales con conectividad limitada o inexistente. Utiliza tecnología de reconocimiento facial **OpenCV LBPH** (Local Binary Patterns Histograms) para identificación precisa y opera completamente offline, sincronizando datos cuando hay conexión disponible.

### Características Principales

- ✅ **Funcionamiento 100% Offline**: Opera sin internet usando almacenamiento local (IndexedDB)
- 🔐 **Autenticación JWT con Control de Acceso por Roles**: Admin, Supervisor y Operador
- 👤 **Reconocimiento Facial Real**: Tecnología OpenCV LBPH con detección Haar Cascade
- 📱 **Progressive Web App (PWA)**: Instalable como app nativa en Android
- 🔄 **Sincronización Automática**: Backup opcional a MongoDB Atlas cuando hay conexión
- 🔒 **Encriptación Local**: Datos cifrados con Web Crypto API (AES-GCM 256-bit)
- 🌍 **Multiidioma**: Soporte para Español e Inglés (i18next)
- 📊 **Gestión Completa**: CRUD de usuarios, trabajadores y registros de asistencia
- 🎯 **Optimizado para Tablets**: Diseño táctil para Android con botones grandes y alto contraste

---

## 🎯 Casos de Uso

FaceNomad está diseñado específicamente para:

- **Gestión de asistencia en campos agrícolas** sin internet
- **Control de acceso en zonas rurales** con conectividad limitada
- **Seguimiento de trabajadores temporales** en proyectos remotos
- **Registro de entrada/salida** sin necesidad de tarjetas físicas o credenciales

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Frontend (Progressive Web App)
- **React 18** - Framework UI
- **Vite 5** - Build tool y dev server
- **TailwindCSS** - Estilos y diseño responsive
- **React Router** - Navegación SPA
- **i18next** - Internacionalización (ES/EN)
- **IndexedDB** (`idb`) - Almacenamiento offline
- **Lucide React** - Iconografía
- **Vite PWA Plugin** - Service Workers y manifest

#### Backend (API REST)
- **Python 3.11** - Lenguaje principal
- **Flask 3.0.0** - Framework web
- **OpenCV Contrib 4.8.1.78** - Reconocimiento facial LBPH
- **SQLite** - Base de datos local para metadatos
- **PyMongo** - Cliente MongoDB Atlas
- **Flask-CORS** - Gestión de CORS
- **NumPy & Pillow** - Procesamiento de imágenes

#### Base de Datos
- **SQLite** - Almacenamiento local de trabajadores (backend)
- **IndexedDB** - Almacenamiento offline de asistencias (frontend)
- **MongoDB Atlas** - Backup opcional en la nube

### Flujo de Datos

```
┌─────────────┐      HTTP/REST API      ┌──────────────┐
│   React     │ ◄──────────────────────► │    Flask     │
│  Frontend   │    (Port 5000 → 8000)   │   Backend    │
│   (PWA)     │                          │              │
└─────────────┘                          └──────────────┘
      │                                         │
      │ IndexedDB                         SQLite│
      │ (Asistencias)                  (Workers)│
      ▼                                         ▼
┌─────────────┐                          ┌──────────────┐
│  LocalDB    │                          │  workers.db  │
│ Offline-1st │                          │   dataset/   │
└─────────────┘                          └──────────────┘
                                                │
                                  Sync opcional │
                                                ▼
                                         ┌──────────────┐
                                         │   MongoDB    │
                                         │    Atlas     │
                                         └──────────────┘
```

---

## 📦 Requisitos Previos

### Para Desarrollo Local
- **Node.js** 18+ y npm
- **Python** 3.11+
- **Git**

### Para Producción
- Cuenta en **Replit** o servidor con Python/Node
- (Opcional) Cuenta en **MongoDB Atlas** para backup en nube
- Tablet Android o navegador moderno con soporte PWA

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone (https://github.com/SrTcot/face-nomad)
cd facenomad
```

### 2. Configurar Backend

```bash
# Instalar dependencias Python
pip install -r backend/requirements.txt

# Crear base de datos SQLite (se crea automáticamente al iniciar)
# La carpeta backend/dataset/ se creará automáticamente para las fotos
```

### 3. Configurar Frontend

```bash
# Instalar dependencias Node
npm install

# Configurar variables de entorno (opcional)
# El frontend se conecta automáticamente al backend en desarrollo
```

### 4. Configurar MongoDB Atlas (Opcional)

Si deseas usar sincronización en la nube:

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén tu URI de conexión
4. Configura la variable de entorno:

```bash
# En Replit: Usa el panel de Secrets
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/facenomad

# En local: Crea archivo .env en la raíz del proyecto
echo "MONGODB_URI=tu_uri_aqui" > .env
```

### 5. Ejecutar en Modo Desarrollo

```bash
# Terminal 1: Backend (Puerto 8000)
cd backend
python app.py

# Terminal 2: Frontend (Puerto 5000)
npm run dev
```

Abre tu navegador en `http://localhost:5000`

---

## 🔑 Credenciales por Defecto

Al iniciar por primera vez, el sistema crea un usuario administrador:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales inmediatamente después del primer inicio de sesión.

---

## 📖 Guía de Uso

### Roles y Permisos

| Función                          | Admin | Supervisor | Operador |
|----------------------------------|:-----:|:----------:|:--------:|
| Registrar asistencia (entrada/salida) | ✅ | ✅ | ✅ |
| Ver historial de asistencias     | ✅ | ✅ | ❌ |
| Registrar nuevos trabajadores    | ✅ | ❌ | ❌ |
| Gestionar trabajadores (editar/eliminar) | ✅ | ❌ | ❌ |
| Crear/editar/eliminar usuarios   | ✅ | ❌ | ❌ |
| Sincronizar a MongoDB (directo)  | ✅ | ✅ | ❌ |
| Solicitar aprobación de sync     | ❌ | ❌ | ✅ |
| Aprobar solicitudes de sync      | ✅ | ✅ | ❌ |
| Gestionar datos en MongoDB       | ✅ | ❌ | ❌ |

### Flujo de Trabajo Básico

#### 1. Configuración Inicial (Admin)

1. **Iniciar sesión** con credenciales de administrador
2. **Crear usuarios** según sea necesario (Ajustes → Gestión de Usuarios)
3. **Registrar trabajadores**:
   - Ir a "Registrar Trabajador"
   - Capturar foto facial del trabajador
   - Ingresar nombre completo
   - Confirmar registro

#### 2. Registro de Asistencia (Operador/Supervisor/Admin)

1. **Iniciar sesión**
2. En la pantalla principal, hacer clic en **"Registrar Asistencia"**
3. **Permitir acceso a la cámara** cuando se solicite
4. **Posicionar el rostro** del trabajador frente a la cámara
5. El sistema detectará y reconocerá automáticamente al trabajador
6. Seleccionar tipo de registro: **Entrada** o **Salida**
7. Confirmar el registro

✅ El registro se guarda localmente en IndexedDB

#### 3. Consultar Historial (Admin/Supervisor)

1. Ir a **"Historial de Asistencia"**
2. Ver todos los registros locales ordenados por fecha
3. Filtrar por trabajador o fecha si es necesario
4. Exportar datos si se requiere

#### 4. Sincronización con MongoDB (Opcional)

**Para Admin/Supervisor:**
1. Ir a **Ajustes → Gestión de MongoDB**
2. Clic en **"Sincronizar Trabajadores"** para enviar trabajadores a la nube
3. Clic en **"Sincronizar Asistencias"** para enviar asistencias a la nube

**Para Operador:**
1. Ir a **Ajustes → Sincronización**
2. Clic en **"Solicitar Sincronización"**
3. Esperar aprobación de Supervisor/Admin
4. Una vez aprobado, los datos se sincronizan automáticamente

#### 5. Gestión de Trabajadores (Admin)

**Ver trabajadores:**
- Ir a **Ajustes → Gestión de Trabajadores**
- Ver lista completa con fechas de registro

**Eliminar trabajadores:**
- Seleccionar trabajadores con checkbox
- Clic en **"Eliminar Seleccionados"**
- Confirmar eliminación

**Gestión en MongoDB (Admin):**
- Ir a **Ajustes → Gestión de MongoDB**
- Ver trabajadores/asistencias en la nube
- Eliminar registros individuales o en lote

---

## 📁 Estructura del Proyecto

```
facenomad/
├── backend/                    # Backend Flask
│   ├── app.py                 # Aplicación principal Flask
│   ├── models.py              # Modelos SQLAlchemy
│   ├── mongo_service.py       # Servicio MongoDB Atlas
│   ├── requirements.txt       # Dependencias Python
│   ├── workers.db            # Base de datos SQLite (generado)
│   ├── dataset/              # Fotos de trabajadores (generado)
│   └── haarcascade_frontalface_default.xml
│
├── src/                       # Frontend React
│   ├── screens/              # Pantallas principales
│   │   ├── WelcomeScreen.jsx        # Pantalla de bienvenida
│   │   ├── LoginScreen.jsx          # Inicio de sesión
│   │   ├── HomeScreen.jsx           # Dashboard principal
│   │   ├── CaptureScreen.jsx        # Captura facial
│   │   ├── ValidationScreen.jsx     # Validación de reconocimiento
│   │   ├── HistoryScreen.jsx        # Historial de asistencias
│   │   ├── SettingsScreen.jsx       # Configuración y admin
│   │   └── WorkerRegistrationScreen.jsx # Registro de trabajadores
│   │
│   ├── components/           # Componentes reutilizables
│   ├── db/                   # Gestión IndexedDB
│   │   └── indexedDB.js     # API de almacenamiento offline
│   ├── services/            # Servicios API
│   │   └── api.js          # Cliente HTTP para backend
│   ├── i18n/               # Traducciones
│   │   ├── es.json        # Español
│   │   └── en.json        # Inglés
│   ├── App.jsx            # Componente raíz
│   └── main.jsx          # Entry point
│
├── public/                  # Archivos públicos PWA
│   ├── icons/              # Iconos de la app
│   └── manifest.json      # Manifest PWA (generado)
│
├── start.sh               # Script de deployment producción
├── vite.config.js        # Configuración Vite
├── tailwind.config.js    # Configuración TailwindCSS
├── package.json          # Dependencias Node.js
├── replit.md            # Documentación del proyecto
└── README.md           # Este archivo
```

---

## 🌐 Deployment (Publicación)

### Deployment en Replit (Recomendado)

FaceNomad está optimizado para **Reserved VM deployment** en Replit:

1. **Push tu código** a tu Repl de Replit
2. Configurar variable de entorno `MONGODB_URI` en Secrets (opcional)
3. Hacer clic en el botón **"Deploy"**
4. El sistema ejecutará automáticamente:
   - `npm run build` - Compila el frontend React
   - `python app.py` - Inicia Flask en producción
5. Tu app estará disponible en: `https://tuapp.replit.app`

**Arquitectura de Producción:**
- Flask sirve tanto el frontend (archivos estáticos de `dist/`) como el backend API
- Todo opera desde un solo puerto (5000 → 80 en producción)
- Service Worker cachea recursos para funcionamiento offline

### Deployment Manual

Si deseas desplegar en otro servidor:

```bash
# 1. Compilar frontend
npm run build

# 2. El backend Flask servirá automáticamente los archivos de dist/
# 3. Iniciar servidor Flask
cd backend
python app.py
```

Configura tu servidor web (nginx/Apache) para hacer proxy al puerto 5000.

---

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `MONGODB_URI` | URI de conexión a MongoDB Atlas | No | None (funciona sin MongoDB) |
| `PORT` | Puerto para Flask en producción | No | 5000 |
| `SECRET_KEY` | Clave secreta para JWT | Sí | Generada automáticamente |

### Ajustar Precisión del Reconocimiento Facial

Edita `backend/app.py`:

```python
# Línea ~200 en la función recognize()
confidence = recognizer.predict(face_resized)

# Ajustar umbral de confianza (menor = más estricto)
if confidence < 50:  # Valor por defecto: 50
    # Reconocido
```

Valores recomendados:
- **40-50**: Alta precisión (menos falsos positivos, más rechazos)
- **50-70**: Precisión balanceada (recomendado)
- **70-100**: Baja precisión (más tolerante, más falsos positivos)

### Personalizar Colores y Branding

Edita `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#16a34a',    // Verde principal
      secondary: '#78350f',  // Marrón tierra
      // Personaliza según tu marca
    }
  }
}
```

---

## 🛡️ Seguridad

- ✅ **JWT Authentication**: Tokens firmados con HS256
- ✅ **Password Hashing**: Contraseñas con bcrypt
- ✅ **Local Encryption**: AES-GCM 256-bit para datos sensibles en IndexedDB
- ✅ **Role-Based Access Control**: Permisos granulares por rol
- ✅ **CORS Configurado**: Solo orígenes permitidos
- ✅ **SQL Injection Protection**: SQLAlchemy ORM
- ✅ **XSS Protection**: React escapa automáticamente

### Recomendaciones de Seguridad

1. **Cambiar credenciales por defecto** inmediatamente
2. **Usar HTTPS** en producción
3. **Rotar SECRET_KEY** periódicamente
4. **Mantener dependencias actualizadas**
5. **Limitar intentos de login** (implementar rate limiting si es necesario)
6. **Backup regular** de `workers.db` y fotos en `dataset/`

---

## 🐛 Troubleshooting

### El reconocimiento facial no funciona

1. Verificar que la cámara tiene buena iluminación
2. El trabajador debe estar registrado previamente
3. Revisar logs del backend: `backend/app.py` imprime confianza de reconocimiento
4. Verificar que existe `backend/trainer/trainer.yml` (modelo entrenado)

### No se puede acceder a la cámara

1. Permitir permisos de cámara en el navegador
2. En producción, HTTPS es requerido para acceso a cámara
3. Verificar que no hay otra app usando la cámara

### Sincronización a MongoDB falla

1. Verificar `MONGODB_URI` está configurado correctamente
2. Revisar conectividad a internet
3. Confirmar que MongoDB Atlas permite tu IP (whitelist en Atlas)
4. Revisar logs del backend para errores específicos

### La app no carga después de deployment

1. Verificar que `npm run build` se ejecutó exitosamente
2. Confirmar que Flask está sirviendo desde `dist/`
3. Revisar logs del servidor para errores de Python
4. Limpiar caché del navegador

---

## 📊 Métricas y Monitoreo

### Health Check Endpoint

```bash
curl http://localhost:8000/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "version": "1.6.0",
  "app_name": "FaceNomad",
  "workers_count": 10,
  "trained": true,
  "auth_enabled": true
}
```

### Base de Datos

**Consultar estadísticas de SQLite:**
```bash
sqlite3 backend/workers.db
sqlite> SELECT COUNT(*) FROM workers;
sqlite> SELECT COUNT(*) FROM users;
sqlite> .exit
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor
-Juan Felipe Sánchez Arango
[Juan Felipe Development Services](https://JuanFelipeDevelopmentServices.replit.app)
Desarrollado para gestión de asistencia en entornos rurales con conectividad limitada.

---

## 🙏 Agradecimientos

- **OpenCV Community** - Por la librería de reconocimiento facial
- **React Team** - Por el framework frontend
- **Flask Community** - Por el framework backend
- **MongoDB** - Por el servicio de base de datos en la nube

---

## 📞 Soporte / Contacto

-correo: jpipearango@gmail.com
- [LinkedIn](https://shorturl.at/7VuIp)
- [Github](https://shorturl.at/iwbBF)



Para preguntas, problemas o sugerencias:

- Abre un **Issue** en GitHub
- Revisa la documentación en `replit.md`
- Consulta la sección de **Troubleshooting** arriba

---

**FaceNomad v1.6.0** - Sistema de Reconocimiento Facial para Asistencia Offline

© 2025 FaceNomad. Todos los derechos reservados.
