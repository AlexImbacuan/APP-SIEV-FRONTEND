/**
 * Cliente central de la API. Todas las llamadas al backend pasan por aquí.
 *  - Agrega el header Authorization: Bearer <accessToken>
 *  - 401 → renueva la sesión UNA vez con el refreshToken y repite la petición.
 *          Si la renovación falla, cierra la sesión y avisa a la app
 *          (AuthContext redirige al login).
 *  - 403 → lanza el error con el mensaje del backend SIN cerrar la sesión
 *
 * El accessToken dura 15 minutos y el refreshToken 7 días. Cada refresh
 * devuelve un refreshToken NUEVO (el anterior deja de servir).
 */
const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'https://app-siev-backend.onrender.com'
).replace(/\/$/, '');
const AUTH_REFRESH = process.env.REACT_APP_AUTH_REFRESH || '/auth/refresh';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

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

// ---------- Tokens ----------
function leer(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function getToken() {
  return leer(TOKEN_KEY);
}

export function getRefreshToken() {
  return leer(REFRESH_TOKEN_KEY);
}

/** Guarda el accessToken y, si viene, el refreshToken. */
export function setTokens({ accessToken, refreshToken }) {
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    // ignore storage errors
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Clave de una versión anterior del frontend
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

// ---------- Refresh ----------
// Si varias peticiones reciben 401 a la vez, todas esperan este mismo refresh.
// Lanzar dos en paralelo haría fallar el segundo, porque el primero ya rotó el token.
let refreshEnCurso = null;

function renovarSesion() {
  if (refreshEnCurso) return refreshEnCurso;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(false);

  refreshEnCurso = (async () => {
    try {
      const res = await fetch(buildUrl(AUTH_REFRESH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      if (!data?.accessToken) return false;

      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch (e) {
      return false;
    } finally {
      refreshEnCurso = null;
    }
  })();

  return refreshEnCurso;
}

function cerrarSesion(avisar) {
  clearTokens();
  if (avisar) {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { mensaje: MENSAJE_SESION_EXPIRADA } }),
    );
  }
}

/**
 * Opciones extra:
 *  - timeout: ms (por defecto 30000)
 *  - auth: false → no envía el token ni intenta refresh (login, logout)
 *  - skipSessionHandling: si la sesión no se puede renovar, borra los tokens
 *    pero NO dispara el evento global (lo usa AuthContext al recargar la página)
 */
export async function apiRequest(path, options = {}) {
  const url = buildUrl(path);

  const controller = new AbortController();
  const timeout = options.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = Object.assign({}, options.headers || {});

  const tokenUsado = options.auth === false ? null : getToken();
  if (tokenUsado) {
    headers.Authorization = `Bearer ${tokenUsado}`;
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

  if (estado === 401 && options.auth !== false) {
    if (!options._retry) {
      // Otra petición ya renovó el token mientras esta estaba en vuelo: solo repetir
      const tokenActual = getToken();
      const renovado = tokenActual && tokenActual !== tokenUsado ? true : await renovarSesion();
      if (renovado) {
        return apiRequest(path, { ...options, _retry: true });
      }
    }
    cerrarSesion(!options.skipSessionHandling);
    throw new ApiError(MENSAJE_SESION_EXPIRADA, 401, payload);
  }

  if (estado === 403) {
    const mensaje = payload && typeof payload === 'object' ? payload.mensaje : '';
    throw new ApiError(mensaje || MENSAJE_SIN_PERMISO, 403, payload);
  }

  throw new ApiError(extraerMensaje(payload, estado), estado, payload);
}
