/**
 * Cliente central de la API. Todas las llamadas al backend pasan por aquí.
 *  - Agrega el header Authorization: Bearer <accessToken>
 *  - 401 → cierra la sesión y avisa a la app (AuthContext redirige al login)
 *  - 403 → lanza un error "No tienes permiso" SIN cerrar la sesión
 *
 * El backend NO tiene endpoint de refresh: el accessToken dura 15 minutos y al
 * vencer cualquier petición devuelve 401.
 */
const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'https://app-siev-backend.onrender.com'
).replace(/\/$/, '');

const TOKEN_KEY = 'authToken';

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
export const MENSAJE_SESION_EXPIRADA = 'Tu sesión expiró, inicia sesión de nuevo';
export const MENSAJE_SIN_PERMISO = 'No tienes permiso';

/** Error de la API con el código HTTP en `estado` (mismo nombre que usa el backend). */
export class ApiError extends Error {
  constructor(message, estado, payload) {
    super(message);
    this.name = 'ApiError';
    this.estado = estado;
    this.status = estado;
    this.payload = payload;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // ignore storage errors
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    // Claves de versiones anteriores del frontend
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  } catch (e) {
    // ignore
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

// El backend responde los errores como { fecha, estado, error, mensaje, ruta }
function extraerMensaje(payload, estado) {
  if (payload && typeof payload === 'object') {
    return payload.mensaje || payload.message || payload.error || `Error ${estado}`;
  }
  if (typeof payload === 'string' && payload.trim()) return payload;
  return `Error ${estado}`;
}

/**
 * Opciones extra:
 *  - timeout: ms (por defecto 30000)
 *  - auth: false para no enviar el header Authorization (login)
 *  - skipSessionHandling: un 401 NO dispara el cierre de sesión global (se usa
 *    en el login, donde 401 significa credenciales incorrectas)
 */
export async function apiRequest(path, options = {}) {
  const url = buildUrl(path);

  const controller = new AbortController();
  const timeout = options.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = Object.assign({}, options.headers || {});

  const token = getToken();
  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is a plain object and not FormData, stringify and set JSON header
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let response;
  let payload;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
      signal: controller.signal,
      credentials: options.credentials || 'same-origin',
    });

    const contentType = response.headers.get('content-type') || '';
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Intenta de nuevo.', 0);
    }
    // fetch lanza TypeError si no hay conexión, el servidor está caído o CORS lo bloquea
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  } finally {
    clearTimeout(timer);
  }

  if (response.ok) {
    return payload;
  }

  const estado = response.status;

  if (estado === 401 && !options.skipSessionHandling) {
    clearToken();
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { mensaje: MENSAJE_SESION_EXPIRADA } }),
    );
    throw new ApiError(MENSAJE_SESION_EXPIRADA, 401, payload);
  }

  if (estado === 403) {
    throw new ApiError(MENSAJE_SIN_PERMISO, 403, payload);
  }

  throw new ApiError(extraerMensaje(payload, estado), estado, payload);
}
