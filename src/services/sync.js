import { api } from './api';
import { getAllRegistros } from '../db/indexedDB';

const SYNC_STATUS_KEY = 'facenomad-sync-status';

export const syncService = {
  async getLastSyncTime() {
    const status = localStorage.getItem(SYNC_STATUS_KEY);
    return status ? JSON.parse(status).lastSync : null;
  },

  async setLastSyncTime(time) {
    const status = {
      lastSync: time || new Date().toISOString(),
      lastAttempt: new Date().toISOString()
    };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  },

  async uploadRecords() {
    try {
      const allRecords = await getAllRegistros();
      
      const pendingRecords = allRecords.map(record => ({
        workerId: record.workerId,
        workerName: record.workerName,
        type: record.type,
        timestamp: new Date(record.timestamp).toISOString(),
        confidence: record.confidence,
        clientId: 'facenomad-client'
      }));

      if (pendingRecords.length === 0) {
        return {
          success: true,
          message: 'No hay registros pendientes de sincronización',
          synced_count: 0
        };
      }

      const result = await api.syncUpload(pendingRecords);
      
      if (result.success) {
        await this.setLastSyncTime();
      }
      
      return result;
    } catch (error) {
      console.error('Error al sincronizar registros:', error);
      throw error;
    }
  },

  async downloadRecords() {
    try {
      const lastSync = await this.getLastSyncTime();
      const result = await api.syncDownload(lastSync);
      
      return result;
    } catch (error) {
      console.error('Error al descargar registros:', error);
      throw error;
    }
  },

  async performFullSync() {
    try {
      const uploadResult = await this.uploadRecords();
      const downloadResult = await this.downloadRecords();
      
      return {
        success: true,
        uploaded: uploadResult.synced_count || 0,
        downloaded: downloadResult.count || 0
      };
    } catch (error) {
      console.error('Error en sincronización completa:', error);
      throw error;
    }
  }
};
