import { ApiError, apiRequest, clearToken, getToken, setToken } from './apiClient';

const AUTH_LOGIN = process.env.REACT_APP_AUTH_LOGIN || '/auth/login';
const AUTH_ME = process.env.REACT_APP_AUTH_ME || '/api/auth/me';

export const authService = {
  /**
   * POST /auth/login con { email, password } → { accessToken, refreshToken }.
   * Guarda solo el accessToken (el backend no tiene endpoint de refresh).
   * Si falla lanza ApiError con el "mensaje" del backend tal cual
   * (p. ej. "Email o contraseña incorrectos" o "El usuario está desactivado").
   */
  login: async (email, password) => {
    const response = await apiRequest(AUTH_LOGIN, {
      method: 'POST',
      body: { email, password },
      // Render puede tardar en "despertar" el servidor en la primera petición
      timeout: 60000,
      auth: false,
      skipSessionHandling: true,
    });

    if (!response?.accessToken) {
      throw new ApiError('El servidor no devolvió un token de acceso', 0, response);
    }

    setToken(response.accessToken);
  },

  /**
   * GET /api/auth/me → { id, nombre, email, activo, rol, permisos }.
   * Un 401 aquí cierra la sesión automáticamente (lo maneja apiClient).
   */
  me: (options = {}) => apiRequest(AUTH_ME, { timeout: 60000, ...options }),

  isAuthenticated: () => !!getToken(),

  logout: () => {
    clearToken();
  },
};
