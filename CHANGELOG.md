# Changelog

Todos los cambios notables en **FaceNomad** serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Planificado
- Sincronización automática con servidor en la nube
- Reportes de asistencia en PDF
- Notificaciones push para supervisores
- Soporte para múltiples dispositivos
- Dashboard de analytics en tiempo real

---

## [1.5.0] - "Enterprise User Management" - 2025-10-25

### Añadido
- **CRUD completo de usuarios en panel de administración**
  - Funcionalidad de edición de usuarios con formulario dedicado
  - Botón de "Editar" (icono lápiz azul) para cada usuario en la tabla
  - Campo de contraseña opcional en modo edición (mantiene contraseña actual si se deja vacío)
  - Validación de datos en tiempo real
- **Diferenciación visual de formularios**
  - Formulario de creación con fondo verde
  - Formulario de edición con fondo azul
  - Botones de cancelar en ambos formularios
- **Mejoras de UX en panel de administración**
  - Confirmaciones antes de eliminar usuarios
  - Mensajes de éxito/error claros
  - Recarga automática de datos después de operaciones

### Cambiado
- Mejorada la interfaz del panel de administración para operaciones completas
- Optimizada la experiencia de usuario con colores distintivos
- Actualizado el flujo de trabajo de gestión de usuarios

### Técnico
- Implementado endpoint PUT /api/users/:id para actualización
- Lógica de actualización parcial de datos (patch)
- Validación de unicidad de username y email

---

## [1.4.0] - "Supervisor Access Control" - 2025-10-25

### Añadido
- **Sistema de restricción de acceso para supervisores**
  - Mensaje informativo explicando limitaciones de acceso
  - Usuario de prueba: `supervisor_test` / `supervisor123`
  - Pantalla de información de permisos limitados
- **Validación de permisos en frontend**
  - Ocultamiento dinámico de botones según rol
  - Rutas protegidas por tipo de usuario

### Cambiado
- **BREAKING CHANGE**: Supervisores ahora NO pueden registrar entradas/salidas
- Permisos del rol supervisor actualizados en base de datos:
  - `register_attendance: false`
  - `manage_workers: false`
  - `manage_users: false`
  - Solo mantiene `view_records: true`
- **Interfaz adaptativa por rol**
  - Botones de entrada/salida ocultos para supervisores
  - Botones de gestión de trabajadores ocultos para supervisores
  - Acceso limitado a: Historial y Configuración únicamente

### Corregido
- Sincronización de permisos entre base de datos y UI
- Validación de roles en rutas protegidas

### Seguridad
- Implementada verificación de permisos en capa de presentación
- Prevención de acceso no autorizado a funcionalidades restringidas

---

## [1.3.0] - "Authentication & UX Fixes" - 2025-10-25

### Añadido
- **Barra de usuario en pantalla principal**
  - Muestra nombre de usuario y rol actual
  - Botón "Cerrar Sesión" visible para todos los usuarios
  - Información contextual del usuario autenticado
- **Función de logout mejorada**
  - Limpieza completa de sesión
  - Redirección automática a login
  - Invalidación de tokens

### Corregido
- **CRÍTICO**: Error JWT "Subject must be a string"
  - Cambiado formato de identity de diccionario a string
  - Corrección de compatibilidad con Flask-JWT-Extended
- **CRÍTICO**: Ruta del dataset de trabajadores
  - Corregida de `backend/dataset` a `dataset`
  - Carga correcta de fotos de trabajadores
  - Reconocimiento facial ahora operativo al 100%
- **5 trabajadores registrados y funcionando**
  - daniela_rivera
  - gorrito_juan
  - juan_sanchez
  - julian_arcos
  - yara

### Mejorado
- Limpieza de código de debugging en backend
- Parámetros de detección facial optimizados:
  - scaleFactor: 1.1
  - minNeighbors: 3
  - minSize: (30, 30)
- Rendimiento del reconocimiento facial mejorado
- Mensajes de log más informativos

### Técnico
- Refactorización de lógica de autenticación
- Optimización de carga de dataset
- Mejora en manejo de errores

---

## [1.2.0] - "Duplicate Prevention System" - 2025-10-25

### Añadido
- **Sistema de prevención de registros duplicados**
  - Función `checkDuplicateRegistro` en IndexedDB
  - Validación automática antes de guardar registros
  - Detección de patrones anómalos (entradas/salidas consecutivas)
- **Interfaz de advertencias**
  - Mensajes de error claros al intentar duplicados
  - Advertencias visuales con detalles del último registro:
    - Tipo de registro (entrada/salida)
    - Fecha y hora exacta
    - Nombre del trabajador
- **Validación en ValidationScreen**
  - Verificación en tiempo real
  - Prevención de envío de duplicados

### Cambiado
- Lógica de guardado de registros ahora incluye validación previa
- Mensajes de error más descriptivos y contextuales
- Sistema ahora bloquea entradas/salidas consecutivas del mismo tipo

### Mejorado
- **Integridad de datos mejorada**
  - Patrón alternante obligatorio entrada → salida → entrada
  - Prevención de inconsistencias en base de datos
  - Reducción de errores humanos
- Experiencia de usuario al mostrar información del último registro

### Técnico
- Implementación de validación en capa de datos
- Consultas optimizadas para verificación de duplicados
- Manejo de casos edge

---

## [1.1.0] - "Enterprise Authentication System" - 2025-10-25

### Añadido
- **Sistema completo de autenticación JWT**
  - Tokens de acceso (15 minutos de validez)
  - Tokens de refresh (7 días de validez)
  - Renovación automática de tokens
  - Lista negra de tokens revocados
- **Sistema de control de acceso basado en roles (RBAC)**
  - Tres roles predefinidos:
    - **Admin**: Acceso completo al sistema
    - **Supervisor**: Gestión y visualización limitada
    - **Operador**: Solo registro de asistencias
  - Permisos granulares por rol (JSON)
- **Panel de administración completo**
  - Gestión de usuarios (crear, listar, eliminar)
  - Visualización de roles y permisos
  - Estadísticas en tiempo real:
    - Total de trabajadores
    - Total de usuarios
    - Registros totales
    - Registros del día
- **Seguridad de datos**
  - Encriptación local con Web Crypto API
  - Algoritmo AES-GCM 256-bit
  - Almacenamiento seguro de tokens
  - Contraseñas hasheadas con bcrypt
- **API modular de sincronización cloud**
  - Endpoints para upload/download de registros
  - Preparado para sincronización futura
- **Interfaz de autenticación**
  - Pantalla de login profesional
  - Manejo de errores de autenticación
  - Mensajes de feedback al usuario
- **Componente PrivateRoute**
  - Protección de rutas por autenticación
  - Redirección automática a login
  - Validación de tokens en cada ruta

### Cambiado
- Todas las rutas de API ahora requieren autenticación
- Arquitectura del backend con middlewares de autenticación
- Almacenamiento de datos ahora incluye encriptación

### Seguridad
- **Contraseñas nunca almacenadas en texto plano**
- **Tokens JWT con firma HMAC SHA-256**
- **Middleware de validación en todas las rutas protegidas**
- **Expiración automática de sesiones**
- **Revocación de tokens al cerrar sesión**

### Base de Datos
- Nueva tabla `users`:
  - username, email, full_name
  - password_hash (bcrypt)
  - role_id (foreign key)
  - is_active, created_at, last_login
- Nueva tabla `roles`:
  - name, description
  - permissions (JSON)
  - created_at
- Nueva tabla `attendance_sync`:
  - Para sincronización futura con la nube

### Credenciales Iniciales
```
Usuario: admin
Contraseña: admin123
⚠️ DEBE CAMBIARSE INMEDIATAMENTE EN PRODUCCIÓN
```

### Técnico
- Flask-JWT-Extended integrado
- Decoradores personalizados para roles
- Manejo de errores JWT personalizado
- Sistema de callbacks para tokens

---

## [1.0.0] - "Genesis - Offline Biometric System" - 2025-10-24

### Añadido
- **Sistema de reconocimiento facial biométrico offline**
  - Algoritmo LBPH (Local Binary Patterns Histograms)
  - Detección facial con Haar Cascade
  - Entrenamiento automático del modelo
  - Reconocimiento en tiempo real
- **Progressive Web Application (PWA)**
  - Funciona completamente offline
  - Instalable como app nativa en Android
  - Service Workers para cache de recursos
  - Manifest para instalación
- **6 pantallas principales**
  - Pantalla de Bienvenida (Welcome)
  - Captura de Imagen (Capture)
  - Validación de Reconocimiento (Validation)
  - Historial de Asistencias (History)
  - Configuración (Settings)
  - Registro de Trabajadores (Worker Registration)
- **Gestión de trabajadores**
  - Registro de nuevos trabajadores con foto
  - Eliminación de trabajadores
  - Reentrenamiento automático del modelo
  - Dataset local de imágenes
- **Sistema de almacenamiento offline**
  - IndexedDB para persistencia de datos
  - Almacenamiento de registros de entrada/salida
  - Sincronización futura preparada
- **Interfaz optimizada para tablets**
  - Diseño táctil con botones grandes (80x80px mínimo)
  - Alto contraste para ambientes con luz solar
  - Paleta de colores verde/marrón/blanco
  - Iconografía agrícola
  - Feedback visual inmediato
- **Soporte multiidioma**
  - Español (por defecto)
  - Inglés
  - Cambio de idioma en tiempo real
  - i18next integration
- **Backend Flask RESTful API**
  - Endpoints para reconocimiento facial
  - Gestión de trabajadores
  - Health check endpoint
  - CORS habilitado para desarrollo

### Características Principales
- ✅ **100% Offline** - No requiere internet para funcionar
- ✅ **Reconocimiento facial en tiempo real** - Menos de 2 segundos
- ✅ **Registro entrada/salida** - Control de asistencia completo
- ✅ **Historial persistente** - Almacenado localmente
- ✅ **Diseño rural-friendly** - Optimizado para trabajadores de campo
- ✅ **Instalable** - Como app nativa en dispositivos Android

### Tecnologías Implementadas

#### Frontend
- React 18.3.1
- Vite 5.4.11
- TailwindCSS 3.4.15
- React Router 6.28.0
- i18next 23.16.8
- IndexedDB (idb 8.0.1)
- Lucide React 0.460.0
- Vite PWA Plugin 0.20.5

#### Backend
- Python 3.11
- Flask 3.0.0
- Flask-CORS 4.0.0
- OpenCV Contrib 4.8.1.78
- NumPy 1.24.3
- Pillow 10.1.0

### Arquitectura
- **Client-Server** separado
  - Frontend: React PWA (puerto 5000)
  - Backend: Flask API (puerto 8000)
- **Offline-first design**
  - Todos los datos críticos en IndexedDB
  - Service Workers para cache
- **Dual workflow**
  - Proceso frontend independiente
  - Proceso backend independiente

### Diseño UX
- **Minimalista y funcional**
- **Bajo nivel técnico** - Interfaz simple e intuitiva
- **Prioridad en usabilidad** sobre estética
- **Optimizado para touchscreen**
- **Feedback inmediato** en todas las acciones

---

## [0.3.0] - "Beta - Field Testing" - 2025-10-20

### Añadido
- Pruebas de campo con usuarios reales
- Ajustes de UX basados en feedback
- Optimización de detección facial en condiciones de luz variable
- Logs detallados para debugging

### Cambiado
- Umbral de confianza de reconocimiento ajustado a 70
- Tamaño mínimo de rostro aumentado a 30x30 px
- Mejoras en la interfaz de captura de imagen

### Corregido
- Problemas de rendimiento en tablets de gama baja
- Errores de reconocimiento con iluminación directa
- Crashes al eliminar trabajadores

---

## [0.2.0] - "Alpha - Core Features" - 2025-10-15

### Añadido
- Implementación inicial de reconocimiento facial con OpenCV
- Sistema básico de registro de trabajadores
- Almacenamiento local con IndexedDB
- Interfaz básica con React

### Técnico
- Integración de LBPH algorithm
- Configuración de Haar Cascade
- API REST básica con Flask
- CORS configurado para desarrollo

---

## [0.1.0] - "Proof of Concept" - 2025-10-10

### Añadido
- Concepto inicial del sistema
- Prototipo de interfaz
- Pruebas de viabilidad de OpenCV en navegador
- Diseño de arquitectura offline-first

### Investigación
- Evaluación de algoritmos de reconocimiento facial
- Pruebas de rendimiento en tablets Android
- Análisis de requisitos para ambientes rurales

---

## Tipos de Cambios

- `Añadido` - Para nuevas características
- `Cambiado` - Para cambios en funcionalidad existente
- `Obsoleto` - Para características que se eliminarán pronto
- `Eliminado` - Para características eliminadas
- `Corregido` - Para correcciones de errores
- `Seguridad` - Para vulnerabilidades corregidas
- `Técnico` - Para cambios técnicos sin impacto funcional visible

---

## Convenciones de Versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (0.0.X): Correcciones de errores compatibles con versiones anteriores

---

## Enlaces

- [Repositorio](https://github.com/tu-usuario/facenomad)
- [Documentación](./replit.md)
- [Reporte de Issues](https://github.com/tu-usuario/facenomad/issues)

---

**FaceNomad** - Sistema de Reconocimiento Facial para Control de Asistencia  
Desarrollado con ❤️ para trabajadores del campo
