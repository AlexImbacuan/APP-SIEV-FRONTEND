import React, { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PaginaServicio from './PaginaServicio';
import contenido from '../../data/servicios.json';
import '../Landing.css';
import './PaginaServicio.css';

/**
 * Ruta /servicios/:slug. Busca el servicio en servicios.json y muestra su página.
 * En producción el HTML de cada servicio ya viene armado desde el build
 * (scripts/prerender.js); aquí React toma el control para el menú y la sesión.
 */
export default function ServicioRuta() {
  const { slug } = useParams();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const servicio = contenido.servicios.find((s) => s.slug === slug);

  useEffect(() => {
    if (!servicio) return;
    document.title = servicio.tituloSeo;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', servicio.descripcionSeo);
  }, [servicio]);

  if (!servicio) return <Navigate to="/" replace />;

  return (
    <PaginaServicio
      servicio={servicio}
      currentUser={usuario ? usuario.nombre || usuario.email : null}
      onLoginClick={() => navigate('/login')}
      onPanelClick={() => navigate('/modulos')}
      onLogout={logout}
    />
  );
}
