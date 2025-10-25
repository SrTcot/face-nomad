import { getAllRegistros, deleteRegistro } from '../db/indexedDB';

export const cleanDuplicateRegistros = async () => {
  const registros = await getAllRegistros();
  const seen = new Set();
  const duplicates = [];

  for (const registro of registros) {
    const key = `${registro.workerId}-${registro.type}-${registro.date}-${registro.time}`;
    
    if (seen.has(key)) {
      duplicates.push(registro.id);
    } else {
      seen.add(key);
    }
  }

  for (const id of duplicates) {
    await deleteRegistro(id);
  }

  return duplicates.length;
};
