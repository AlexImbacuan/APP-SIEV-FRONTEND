import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { MENSAJE_SESION_EXPIRADA, SESSION_EXPIRED_EVENT } from '../services/apiClient';

const AuthContext = createContext(null);

/**
 * Sesión del usuario: { id, nombre, email, activo, rol, permisos } tal como lo
 * devuelve GET /api/auth/me. El usuario vive solo en memoria; en localStorage
 * se guardan únicamente los tokens, y el usuario se vuelve a pedir al recargar.
 * Menús y pantallas se deciden por `usuario.permisos` (ver config/modulos.js).
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Si hay tokens al cargar, se está recuperando la sesión hasta que /me responda
  const [cargando, setCargando] = useState(() => authService.isAuthenticated());
  const [mensajeSesion, setMensajeSesion] = useState('');
  const navigate = useNavigate();

  // Al recargar la página: si hay token, se recupera el usuario con /me
  useEffect(() => {
    if (!authService.isAuthenticated()) return undefined;
    let activo = true;

    authService
      .me({ skipSessionHandling: true })
      .then((datos) => {
        if (activo) setUsuario(datos);
      })
      .catch((error) => {
        if (!activo) return;
        if (error.estado === 401) {
          // Ni el token ni el refresh sirven (o el usuario fue desactivado):
          // apiClient ya borró los tokens
          setMensajeSesion(MENSAJE_SESION_EXPIRADA);
        }
        setUsuario(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Si una petición recibe 401 y el refresh también falla: sesión cerrada, al login
  useEffect(() => {
    const onSesionExpirada = (event) => {
      setUsuario(null);
      setMensajeSesion(event.detail?.mensaje || MENSAJE_SESION_EXPIRADA);
      navigate('/login', { replace: true });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSesionExpirada);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSesionExpirada);
  }, [navigate]);

  /** Inicia sesión y carga el usuario. Lanza ApiError con el mensaje del backend. */
  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    try {
      const datos = await authService.me({ skipSessionHandling: true });
      setUsuario(datos);
      setMensajeSesion('');
      return datos;
    } catch (error) {
      authService.logout();
      throw error;
    }
  }, []);

  /** Cierra la sesión en el backend (si falla, igual se cierra aquí) y va al login. */
  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
    setMensajeSesion('');
    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Vuelve a pedir /me para reflejar cambios de rol o permisos hechos por un
   * administrador. Si el token venció se renueva solo (lo maneja apiClient).
   */
  const recargarUsuario = useCallback(async () => {
    try {
      const datos = await authService.me();
      setUsuario(datos);
    } catch (error) {
      // 401 ya se manejó con el evento global; otros errores no cierran la sesión
    }
  }, []);

  const limpiarMensajeSesion = useCallback(() => setMensajeSesion(''), []);

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      mensajeSesion,
      login,
      logout,
      recargarUsuario,
      limpiarMensajeSesion,
    }),
    [usuario, cargando, mensajeSesion, login, logout, recargarUsuario, limpiarMensajeSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
