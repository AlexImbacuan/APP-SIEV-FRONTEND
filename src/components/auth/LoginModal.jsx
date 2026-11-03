import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logo } from '../../data/landingContent';
import './LoginModal.css';

/**
 * Modal de inicio de sesión con correo y contraseña.
 * Props:
 *  - onLogin(usuario): se llama cuando el login es exitoso (token guardado y
 *    usuario cargado desde /api/auth/me)
 *  - onClose(): cierra el modal
 * Muestra tal cual el "mensaje" de error del backend, y el aviso de sesión
 * expirada si se llegó aquí por un 401.
 */
export default function LoginModal({ onLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, mensajeSesion, limpiarMensajeSesion } = useAuth();
  const emailRef = useRef(null);

  // Al abrir: foco en el correo y bloquear el scroll de la página de fondo
  useEffect(() => {
    emailRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Cerrar con Escape (salvo mientras se está enviando)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    limpiarMensajeSesion();
    setLoading(true);

    try {
      const usuario = await login(email.trim(), password);
      onLogin(usuario);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div
      className="lm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-title">
        <button
          type="button"
          className="lm-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <img src={logo.src} alt={logo.alt} className="lm-logo" />
        <h2 id="lm-title">Iniciar sesión</h2>
        <p className="lm-subtitle">Ingresa con tu correo y contraseña</p>

        {mensajeSesion && !error && (
          <div className="lm-aviso" role="status">
            {mensajeSesion}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lm-form">
          <label htmlFor="lm-email">Correo electrónico</label>
          <input
            ref={emailRef}
            id="lm-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@correo.com"
            disabled={loading}
            required
          />

          <label htmlFor="lm-password">Contraseña</label>
          <div className="lm-password">
            <input
              id="lm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="lm-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {error && (
            <div className="lm-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="lm-submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
