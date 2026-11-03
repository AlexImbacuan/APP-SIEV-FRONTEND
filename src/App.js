import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import PanelLayout from './components/layout/PanelLayout';
import RutaProtegida from './components/auth/RutaProtegida';
import InicioModulos from './pages/modulos/InicioModulos';
import ModuloPage from './pages/modulos/ModuloPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function Inicio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Landing
      currentUser={usuario ? usuario.nombre || usuario.email : null}
      onLoginClick={() => navigate('/login')}
      onPanelClick={() => navigate('/modulos')}
      onLogout={logout}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Área privada: requiere sesión. Cada módulo valida además su rol. */}
      <Route
        path="/modulos"
        element={
          <RutaProtegida>
            <PanelLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<InicioModulos />} />
        <Route path=":id" element={<ModuloPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
