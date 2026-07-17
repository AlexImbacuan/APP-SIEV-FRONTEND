import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import ImageRibbon from './components/ImageRibbon';
import ProjectForm from './pages/ProjectForm';
import AdminDashboard from './pages/AdminDashboard';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    const traerempleados = async () => {
      try {
        const response = await fetch('https://app-siev-backend.onrender.com/api/empleados');
        const data = await response.json();
        console.log('Empleados:', data);
      } catch (error) {
        console.error('Error al traer empleados:', error);
      }
    };

    traerempleados();
  });

  const handleLogin = (usuario) => {
    setIsAuthenticated(true);
    setCurrentUser(usuario);
    setShowLoginModal(false);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    authService.logout();
    navigate('/', { replace: true });
  };

  const handleNavigate = (page) => {
    if (page === 'home') navigate('/');
    if (page === 'form') navigate('/form');
    if (page === 'dashboard') navigate('/dashboard');
    window.scrollTo(0, 0);
  };

  const ProtectedDashboard = () => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    return (
      <AdminDashboard onLogout={handleLogout} usuario={currentUser} onNavigate={handleNavigate} />
    );
  };

  const HomeLayout = () => (
    <div className="site">
      <Header
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
        onDashboardClick={() => navigate('/dashboard')}
        onProfileClick={() => setShowProfileModal(true)}
      />

      {showLoginModal && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal usuario={currentUser} onClose={() => setShowProfileModal(false)} />
      )}

      <main className="site-main" id="inicio">
        <section className="hero" aria-labelledby="hero-title">
          <ImageRibbon />
        </section>

        <section className="content-grid" id="servicios" aria-label="Servicios principales">
          <article className="content-card">
            <h3>Instalaciones</h3>
            <p>
              Diseno e implementacion de redes electricas residenciales, comerciales e industriales.
            </p>
          </article>

          <article className="content-card" id="nosotros">
            <h3>Mantenimiento</h3>
            <p>
              Planes preventivos y correctivos para mejorar continuidad, seguridad y rendimiento.
            </p>
          </article>

          <article className="content-card" id="contacto">
            <h3>Asesoria tecnica</h3>
            <p>Acompanamiento profesional para normativas, auditorias y optimizacion energetica.</p>
          </article>
        </section>

        <footer className="site-footer">
          <p>© {new Date().getFullYear()} SIEV. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<HomeLayout />} />
      <Route path="/form" element={<ProjectForm />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
