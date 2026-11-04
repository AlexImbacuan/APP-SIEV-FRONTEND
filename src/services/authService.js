import {
  ApiError,
  apiRequest,
  clearTokens,
  getRefreshToken,
  getToken,
  setTokens,
} from './apiClient';

// El backend acepta estas rutas con y sin el prefijo /api
const AUTH_LOGIN = process.env.REACT_APP_AUTH_LOGIN || '/auth/login';
const AUTH_LOGOUT = process.env.REACT_APP_AUTH_LOGOUT || '/auth/logout';
const AUTH_ME = process.env.REACT_APP_AUTH_ME || '/api/auth/me';

export const authService = {
  /**
   * POST /auth/login con { email, password } → { accessToken, refreshToken }.
   * Guarda los dos tokens. Si falla lanza ApiError con el "mensaje" del backend
   * tal cual (p. ej. "Email o contraseña incorrectos").
   */
  login: async (email, password) => {
    const response = await apiRequest(AUTH_LOGIN, {
      method: 'POST',
      body: { email, password },
      // Render puede tardar en "despertar" el servidor en la primera petición
      timeout: 60000,
      auth: false,
    });

    if (!response?.accessToken) {
      throw new ApiError('El servidor no devolvió un token de acceso', 0, response);
    }

    setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
  },

  /**
   * GET /api/auth/me → { id, nombre, email, activo, rol, permisos }.
   * Si el token venció se renueva solo (lo maneja apiClient).
   */
  me: (options = {}) => apiRequest(AUTH_ME, { timeout: 60000, ...options }),

  isAuthenticated: () => !!(getToken() || getRefreshToken()),

  /**
   * Borra la sesión local de inmediato y avisa al backend (POST /auth/logout
   * con el refreshToken) para que lo invalide. Si esa llamada falla, la sesión
   * en el frontend igual queda cerrada.
   */
  logout: () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    if (!refreshToken) return Promise.resolve();
    return apiRequest(AUTH_LOGOUT, {
      method: 'POST',
      body: { refreshToken },
      auth: false,
      timeout: 10000,
    }).catch(() => {});
  },
};
