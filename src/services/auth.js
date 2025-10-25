import { encryptData, decryptData, clearEncryptionKey } from './crypto';

const TOKEN_KEY = 'facenomad-tokens';
const USER_KEY = 'facenomad-user';

export const authService = {
  async login(username, password) {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    const API_BASE_URL = currentHost.includes('localhost') 
      ? 'http://localhost:8000'
      : `${protocol}//${currentHost}:8000`;
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    
    if (data.success) {
      await this.saveTokens(data.access_token, data.refresh_token);
      await this.saveUser(data.user);
    }
    
    return data;
  },

  async logout() {
    const token = await this.getAccessToken();
    
    if (token) {
      const currentHost = window.location.hostname;
      const protocol = window.location.protocol;
      const API_BASE_URL = currentHost.includes('localhost') 
        ? 'http://localhost:8000'
        : `${protocol}//${currentHost}:8000`;
      
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error al cerrar sesión en el servidor:', error);
      }
    }
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearEncryptionKey();
  },

  async saveTokens(accessToken, refreshToken) {
    const encrypted = await encryptData({
      access: accessToken,
      refresh: refreshToken,
      timestamp: Date.now()
    });
    
    localStorage.setItem(TOKEN_KEY, JSON.stringify(encrypted));
  },

  async getAccessToken() {
    const stored = localStorage.getItem(TOKEN_KEY);
    
    if (!stored) {
      return null;
    }
    
    try {
      const encrypted = JSON.parse(stored);
      const decrypted = await decryptData(encrypted);
      return decrypted ? decrypted.access : null;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  },

  async getRefreshToken() {
    const stored = localStorage.getItem(TOKEN_KEY);
    
    if (!stored) {
      return null;
    }
    
    try {
      const encrypted = JSON.parse(stored);
      const decrypted = await decryptData(encrypted);
      return decrypted ? decrypted.refresh : null;
    } catch (error) {
      console.error('Error al obtener refresh token:', error);
      return null;
    }
  },

  async refreshAccessToken() {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }
    
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    const API_BASE_URL = currentHost.includes('localhost') 
      ? 'http://localhost:8000'
      : `${protocol}//${currentHost}:8000`;
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al refrescar token');
    }
    
    if (data.success) {
      await this.saveTokens(data.access_token, refreshToken);
    }
    
    return data.access_token;
  },

  async saveUser(user) {
    const encrypted = await encryptData(user);
    localStorage.setItem(USER_KEY, JSON.stringify(encrypted));
  },

  async getUser() {
    const stored = localStorage.getItem(USER_KEY);
    
    if (!stored) {
      return null;
    }
    
    try {
      const encrypted = JSON.parse(stored);
      return await decryptData(encrypted);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  },

  async isAuthenticated() {
    const token = await this.getAccessToken();
    return !!token;
  },

  async getUserRole() {
    const user = await this.getUser();
    return user?.role?.name || null;
  },

  async hasPermission(permission) {
    const user = await this.getUser();
    return user?.role?.permissions?.[permission] || false;
  }
};
