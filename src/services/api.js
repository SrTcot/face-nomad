import { authService } from './auth';

function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  
  const currentHost = window.location.hostname;
  
  // En localhost, usa el puerto 8000 directamente
  if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    return 'http://localhost:8000';
  }
  
  // En producción (Replit deployment), usa URL relativa
  // El proxy de Vite redirige /api al backend en puerto 8000
  // En deployment, ambos servicios están en la misma VM
  return '';
}

const API_BASE_URL = getApiBaseUrl();

export function getWorkerPhotoUrl(workerName) {
  return `${API_BASE_URL}/api/workers/${workerName}/photo`;
}

async function getAuthHeaders() {
  const token = await authService.getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function handleResponse(response, retryFn) {
  if (response.status === 401 && retryFn) {
    try {
      await authService.refreshAccessToken();
      return await retryFn();
    } catch (error) {
      await authService.logout();
      window.location.href = '/login';
      throw error;
    }
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
  }
  
  return data;
}

export const api = {
  async health() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },

  async detectFace(base64Image) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/detect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64Image }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async recognizeFace(base64Image) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/recognize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64Image }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async registerWorker(base64Image, name) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          image: base64Image,
          name: name 
        }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getWorkers() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/workers`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async deleteWorker(workerName) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/workers/${encodeURIComponent(workerName)}`, {
        method: 'DELETE',
        headers,
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async retrain() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/retrain`, {
        method: 'POST',
        headers,
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Gestión de usuarios
  async getUsers() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/users`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async createUser(userData) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async updateUser(userId, userData) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async deleteUser(userId) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getRoles() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/roles`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Sincronización
  async syncUpload(records) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/sync/upload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async syncDownload(since) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      const url = since 
        ? `${API_BASE_URL}/api/sync/download?since=${encodeURIComponent(since)}`
        : `${API_BASE_URL}/api/sync/download`;
      return fetch(url, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getStats() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/stats`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Aprobación de sincronización
  async requestSyncApproval(records = []) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/sync/request-approval`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getSyncApprovalStatus() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/sync/approval-status`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getPendingSyncRequests() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/sync/pending-requests`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async approveSyncRequest(approvalId, action) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/sync/approve/${approvalId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // MongoDB Sync
  async syncWorkersToMongo(workers) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/sync-workers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ workers }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async syncAttendanceToMongo(attendance) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/sync-attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ attendance }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getMongoStatus() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/status`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getMongoWorkers(limit = 100) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/workers?limit=${limit}`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async getMongoAttendance(params = {}) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams(params).toString();
      return fetch(`${API_BASE_URL}/api/mongo/attendance?${queryParams}`, { headers });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async deleteMongoWorkers(workerNames) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/workers`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ worker_names: workerNames }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async deleteMongoAttendance(clientIds) {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/attendance`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ client_ids: clientIds }),
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async clearAllMongoWorkers() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/workers/clear-all`, {
        method: 'DELETE',
        headers,
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  async clearAllMongoAttendance() {
    const makeRequest = async () => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/mongo/attendance/clear-all`, {
        method: 'DELETE',
        headers,
      });
    };
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  }
};
