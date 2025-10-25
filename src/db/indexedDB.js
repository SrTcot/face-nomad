import { openDB } from 'idb';

const DB_NAME = 'IdentidadDelCampo';
const DB_VERSION = 1;
const STORE_NAME = 'registros';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('workerId', 'workerId');
        store.createIndex('synced', 'synced');
      }
    },
  });
};

export const addRegistro = async (registro) => {
  const db = await initDB();
  const newRegistro = {
    ...registro,
    timestamp: Date.now(),
    synced: false,
    createdAt: new Date().toISOString()
  };
  return db.add(STORE_NAME, newRegistro);
};

export const getAllRegistros = async () => {
  const db = await initDB();
  const registros = await db.getAll(STORE_NAME);
  return registros.sort((a, b) => b.timestamp - a.timestamp);
};

export const getRegistroById = async (id) => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const updateRegistro = async (id, updates) => {
  const db = await initDB();
  const registro = await db.get(STORE_NAME, id);
  if (registro) {
    const updatedRegistro = { ...registro, ...updates };
    return db.put(STORE_NAME, updatedRegistro);
  }
};

export const deleteRegistro = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const getPendingRegistros = async () => {
  const db = await initDB();
  const allRegistros = await db.getAll(STORE_NAME);
  // Filtrar manualmente los registros no sincronizados
  return allRegistros.filter(r => !r.synced);
};

export const markAsSynced = async (id) => {
  return updateRegistro(id, { synced: true, syncedAt: new Date().toISOString() });
};

export const clearAllRegistros = async () => {
  const db = await initDB();
  return db.clear(STORE_NAME);
};

export const checkDuplicateRegistro = async (workerId, type) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('workerId');
  const workerRegistros = await index.getAll(workerId);
  
  if (workerRegistros.length === 0) {
    return { isDuplicate: false, lastRegistro: null };
  }
  
  const sortedRegistros = workerRegistros.sort((a, b) => b.timestamp - a.timestamp);
  const lastRegistro = sortedRegistros[0];
  
  if (lastRegistro.type === type) {
    return { 
      isDuplicate: true, 
      lastRegistro: lastRegistro,
      message: type === 'entry' 
        ? 'Este trabajador ya tiene una entrada registrada. Debe registrar salida primero.'
        : 'Este trabajador ya tiene una salida registrada. Debe registrar entrada primero.'
    };
  }
  
  return { isDuplicate: false, lastRegistro: lastRegistro };
};
