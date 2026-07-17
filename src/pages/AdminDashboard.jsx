import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import ProjectForm from './ProjectForm';
import ProjectsSection from '../components/projects/ProjectsSection';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout, usuario, onNavigate }) => {
  const [activities, setActivities] = useState([]);
  const [currentView, setCurrentView] = useState('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (activity) =>
        activity.actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.area.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [activities, searchTerm]);

  const handleEditActivity = () => {
    setCurrentView('activities-form');
  };

  const handleDeleteActivity = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      setActivities(activities.filter((a) => a.id !== id));
    }
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <div className="site">
      <Header
        onNavigate={onNavigate}
        isAuthenticated={true}
        currentUser={usuario}
        onLogout={handleLogoutClick}
        onLoginClick={() => {}}
        onDashboardClick={() => setCurrentView('activities')}
        onProfileClick={() => setShowProfileModal(true)}
      />

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-sidebar">
            <div className="dashboard-title">
              <h1>Panel de Control</h1>
              <p>Administración</p>
            </div>

            <nav className="dashboard-nav">
              <button
                className={`dashboard-nav-button ${currentView === 'activities' || currentView === 'activities-form' ? 'active' : ''}`}
                onClick={() => setCurrentView('activities')}
              >
                📋 Actividades ({activities.length})
              </button>
              <button
                className={`dashboard-nav-button ${currentView === 'projects' ? 'active' : ''}`}
                onClick={() => setCurrentView('projects')}
              >
                📁 Proyectos
              </button>
            </nav>
          </div>

          <div className="dashboard-content">
            {currentView === 'activities' && (
              <div className="activities-section">
                <div className="section-header">
                  <h2>Actividades Registradas</h2>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="activity-count">{filteredActivities.length} total</span>
                    <button
                      className="cta-button"
                      onClick={() => {
                        setCurrentView('activities-form');
                      }}
                    >
                      ➕ Crear Actividad
                    </button>
                  </div>
                </div>

                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Buscar actividad o área..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay actividades registradas aún</p>
                    <button
                      onClick={() => setCurrentView('activities-form')}
                      className="cta-button"
                    >
                      Crear Primera Actividad
                    </button>
                  </div>
                ) : (
                  <div className="activities-grid">
                    {filteredActivities.map((activity) => (
                      <div key={activity.id} className="activity-card">
                        <div className="card-header">
                          <h3>{activity.actividad}</h3>
                          <span className="card-area">{activity.area}</span>
                        </div>
                        {activity.descripcion && (
                          <p className="card-description">{activity.descripcion}</p>
                        )}
                        <div className="card-meta">
                          <small>Creado: {activity.createdAt}</small>
                          {activity.updatedAt && <small>Actualizado: {activity.updatedAt}</small>}
                        </div>
                        <div className="card-actions">
                          <button
                            onClick={() => handleEditActivity(activity)}
                            className="edit-button"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="delete-button"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentView === 'activities-form' && (
              <div className="form-section">
                <ProjectForm />
              </div>
            )}

            {currentView === 'projects' && <ProjectsSection />}
          </div>
        </div>
      </main>

      {showProfileModal && (
        <ProfileModal usuario={usuario} onClose={() => setShowProfileModal(false)} />
      )}

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} SIEV. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
