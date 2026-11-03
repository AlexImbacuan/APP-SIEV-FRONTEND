import React, { useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Landing from './Landing';
import LoginModal from '../components/auth/LoginModal';
import { useAuth } from '../context/AuthContext';

/**
 * Ruta /login: la landing con el modal de inicio de sesión abierto.
 * Después del login lleva a la ruta que se intentó abrir, o a /modulos.
 */
export default function LoginPage() {
  const { usuario, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.desde || '/modulos';

  const cerrar = useCallback(() => navigate('/', { replace: true }), [navigate]);

  if (!cargando && usuario) {
    return <Navigate to={destino} replace />;
  }

  return (
    <>
      <Landing />
      {!cargando && (
        <LoginModal onLogin={() => navigate(destino, { replace: true })} onClose={cerrar} />
      )}
    </>
  );
}
