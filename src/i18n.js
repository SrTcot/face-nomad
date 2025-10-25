import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      welcome: {
        title: 'FaceNomad',
        subtitle: 'Sistema de Reconocimiento Facial',
        registerEntry: 'Registrar Entrada',
        registerExit: 'Registrar Salida',
        registerWorker: 'Nuevo Trabajador',
        manage: 'Gestionar',
        history: 'Ver Historial',
        settings: 'Configuración'
      },
      capture: {
        title: 'Reconocimiento Facial',
        instruction: 'Mira al frente por favor',
        detecting: 'Detectando rostro...',
        ready: 'Listo para capturar',
        capture: 'Capturar',
        cancel: 'Cancelar',
        noFaceDetected: 'No se detectó ningún rostro',
        processing: 'Procesando reconocimiento facial...'
      },
      register: {
        title: 'Registrar Nuevo Trabajador',
        instruction: 'Capture una foto clara del rostro',
        nameLabel: 'Nombre del trabajador',
        namePlaceholder: 'Ingrese el nombre completo',
        registerButton: 'Registrar Trabajador',
        success: 'Trabajador registrado exitosamente',
        error: 'Error al registrar trabajador'
      },
      validation: {
        entryRegistered: 'Entrada Registrada',
        exitRegistered: 'Salida Registrada',
        worker: 'Trabajador',
        time: 'Hora',
        date: 'Fecha',
        status: 'Estado',
        entry: 'Entrada',
        exit: 'Salida',
        done: 'Finalizar',
        registerAnother: 'Registrar Otro'
      },
      history: {
        title: 'Historial de Registros',
        empty: 'No hay registros aún',
        synced: 'Sincronizado',
        pending: 'Pendiente',
        search: 'Buscar por nombre...',
        filterAll: 'Todos',
        filterEntry: 'Entradas',
        filterExit: 'Salidas',
        back: 'Volver'
      },
      settings: {
        title: 'Configuración',
        language: 'Idioma',
        spanish: 'Español',
        english: 'English',
        sync: 'Sincronización',
        syncNow: 'Sincronizar Ahora',
        lastSync: 'Última sincronización',
        never: 'Nunca',
        autoSync: 'Sincronización automática',
        maintenance: 'Mantenimiento',
        cleanDuplicates: 'Limpiar Duplicados',
        duplicatesRemoved: 'registros duplicados eliminados',
        noDuplicates: 'No se encontraron duplicados',
        about: 'Acerca de',
        version: 'Versión',
        description: 'FaceNomad es un sistema de reconocimiento facial biométrico diseñado para funcionar completamente offline. Utiliza tecnología OpenCV LBPH para identificar trabajadores y registrar sus entradas y salidas de manera rápida y segura.',
        back: 'Volver'
      },
      common: {
        offline: 'Sin conexión',
        online: 'Conectado',
        savedLocally: 'Guardado localmente',
        syncComplete: 'Sincronización completada',
        syncError: 'Error al sincronizar',
        loading: 'Cargando...'
      }
    }
  },
  en: {
    translation: {
      welcome: {
        title: 'FaceNomad',
        subtitle: 'Facial Recognition System',
        registerEntry: 'Register Entry',
        registerExit: 'Register Exit',
        registerWorker: 'New Worker',
        manage: 'Manage',
        history: 'View History',
        settings: 'Settings'
      },
      capture: {
        title: 'Facial Recognition',
        instruction: 'Please look straight ahead',
        detecting: 'Detecting face...',
        ready: 'Ready to capture',
        capture: 'Capture',
        cancel: 'Cancel',
        noFaceDetected: 'No face detected',
        processing: 'Processing facial recognition...'
      },
      register: {
        title: 'Register New Worker',
        instruction: 'Capture a clear photo of the face',
        nameLabel: 'Worker name',
        namePlaceholder: 'Enter full name',
        registerButton: 'Register Worker',
        success: 'Worker registered successfully',
        error: 'Error registering worker'
      },
      validation: {
        entryRegistered: 'Entry Registered',
        exitRegistered: 'Exit Registered',
        worker: 'Worker',
        time: 'Time',
        date: 'Date',
        status: 'Status',
        entry: 'Entry',
        exit: 'Exit',
        done: 'Done',
        registerAnother: 'Register Another'
      },
      history: {
        title: 'Registration History',
        empty: 'No records yet',
        synced: 'Synced',
        pending: 'Pending',
        search: 'Search by name...',
        filterAll: 'All',
        filterEntry: 'Entries',
        filterExit: 'Exits',
        back: 'Back'
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        spanish: 'Español',
        english: 'English',
        sync: 'Synchronization',
        syncNow: 'Sync Now',
        lastSync: 'Last sync',
        never: 'Never',
        autoSync: 'Auto sync',
        maintenance: 'Maintenance',
        cleanDuplicates: 'Clean Duplicates',
        duplicatesRemoved: 'duplicate records removed',
        noDuplicates: 'No duplicates found',
        about: 'About',
        version: 'Version',
        description: 'FaceNomad is a biometric facial recognition system designed to work completely offline. It uses OpenCV LBPH technology to identify workers and register their entries and exits quickly and securely.',
        back: 'Back'
      },
      common: {
        offline: 'Offline',
        online: 'Online',
        savedLocally: 'Saved locally',
        syncComplete: 'Sync complete',
        syncError: 'Sync error',
        loading: 'Loading...'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
