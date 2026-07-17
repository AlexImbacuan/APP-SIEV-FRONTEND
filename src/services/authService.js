import { apiRequest } from './apiClient';

const AUTH_LOGIN = process.env.REACT_APP_AUTH_LOGIN || '/auth/login';

function setTokens({ accessToken, refreshToken, usuario }) {
  try {
    if (accessToken) localStorage.setItem('authToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (usuario) localStorage.setItem('currentUser', usuario);
  } catch (e) {
    // ignore storage errors
  }
}

function clearTokens() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  } catch (e) {
    // ignore
  }
}

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiRequest(AUTH_LOGIN, {
        method: 'POST',
        body: {
          email,
          password,
        },
        timeout: 15000,
      });

      if (!response?.accessToken) {
        return {
          success: false,
          error: 'El servidor no devolvió un token de acceso',
        };
      }

      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        usuario: response.usuario || email,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error en el login',
      };
    }
  },

  isAuthenticated: () => {
    try {
      return !!localStorage.getItem('authToken');
    } catch (e) {
      return false;
    }
  },

  getCurrentUser: () => {
    try {
      return localStorage.getItem('currentUser');
    } catch (e) {
      return null;
    }
  },

  logout: () => {
    clearTokens();
  },

  setTokens,

  clearTokens,
};
