const API_BASE_URL = (
  process.env.REACT_APP_API_URL || 'https://app-siev-backend.onrender.com'
).replace(/\/$/, '');
const AUTH_REFRESH = process.env.REACT_APP_AUTH_REFRESH || '/auth/refresh';

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function getAuthToken() {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const url = buildUrl(path);

  const controller = new AbortController();
  const timeout = options.timeout || 30000; // default 30s
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = Object.assign({}, options.headers || {});

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is a plain object and not FormData, stringify and set JSON header
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
      signal: controller.signal,
      credentials: options.credentials || 'same-origin',
    });
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      // Attempt token refresh on 401 once
      if (response.status === 401 && !options._retry) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(buildUrl(AUTH_REFRESH), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshPayload = await refreshRes.json();
              // expect { accessToken, refreshToken, usuario? }
              if (refreshPayload?.accessToken) {
                try {
                  localStorage.setItem('authToken', refreshPayload.accessToken);
                  if (refreshPayload.refreshToken)
                    localStorage.setItem('refreshToken', refreshPayload.refreshToken);
                  if (refreshPayload.usuario)
                    localStorage.setItem('currentUser', refreshPayload.usuario);
                } catch (e) {
                  // ignore
                }

                // retry original request with new token
                const newOptions = Object.assign({}, options, { _retry: true });
                return apiRequest(path, newOptions);
              }
            }
          } catch (e) {
            // refresh failed, fall through to throw original error
          }
        }
      }

      const message =
        typeof payload === 'string' ? payload : payload?.message || `HTTP ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
