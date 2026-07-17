import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import ProjectForm from './ProjectForm';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout, usuario, onNavigate }) => {
  const [activities, setActivities] = useState([]);
  const [currentView, setCurrentView] = useState('activities'); // 'activities', 'activities-form', 'projects'
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    serialProyecto: '',
    descripcionGlobal: '',
    valorTotal: '',
    factura: '',
    pago: '',
    observacion: '',
  });

  // Filtrar actividades por búsqueda
  const filteredActivities = useMemo(() => {
    return activities.filter(
      (activity) =>
        activity.actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.area.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [activities, searchTerm]);

  const handleEditActivity = (activity) => {
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

            {currentView === 'projects' && (
              <div className="projects-section">
                <h2>Proyectos</h2>
                <form
                  className="project-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // validar mínimos
                    if (!projectForm.serialProyecto) return alert('Ingrese Serial de proyecto');
                    setProjects([
                      ...projects,
                      {
                        id: Date.now(),
                        ...projectForm,
                        createdAt: new Date().toLocaleString(),
                      },
                    ]);
                    setProjectForm({
                      serialProyecto: '',
                      descripcionGlobal: '',
                      valorTotal: '',
                      factura: '',
                      pago: '',
                      observacion: '',
                    });
                    alert('Proyecto registrado');
                  }}
                >
                  <div className="form-group">
                    <label>Serial de proyecto *</label>
                    <input
                      type="text"
                      value={projectForm.serialProyecto}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, serialProyecto: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción global</label>
                    <textarea
                      value={projectForm.descripcionGlobal}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, descripcionGlobal: e.target.value }))
                      }
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor total</label>
                    <input
                      type="number"
                      value={projectForm.valorTotal}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, valorTotal: e.target.value }))
                      }
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Factura (número)</label>
                    <input
                      type="number"
                      value={projectForm.factura}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, factura: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Pago</label>
                    <input
                      type="text"
                      value={projectForm.pago}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, pago: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Observación</label>
                    <textarea
                      value={projectForm.observacion}
                      onChange={(e) =>
                        setProjectForm((prev) => ({ ...prev, observacion: e.target.value }))
                      }
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-button">
                      ➕ Registrar Proyecto
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setCurrentView('activities')}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>

                <hr style={{ margin: '24px 0' }} />

                <h3>Proyectos registrados</h3>
                {projects.length === 0 ? (
                  <p className="empty-state">No hay proyectos aún</p>
                ) : (
                  <div className="activities-grid">
                    {projects.map((p) => (
                      <div key={p.id} className="activity-card">
                        <div className="card-header">
                          <h3>{p.serialProyecto}</h3>
                          <span className="card-area">{p.valorTotal || '—'}</span>
                        </div>
                        {p.descripcionGlobal && (
                          <p className="card-description">{p.descripcionGlobal}</p>
                        )}
                        <div className="card-meta">
                          <small>Factura: {p.factura || '—'}</small>
                          <small>Pago: {p.pago || '—'}</small>
                          <small>Creado: {p.createdAt}</small>
                        </div>
                        <div className="card-actions">
                          <button
                            onClick={() => {
                              if (window.confirm('Eliminar proyecto?'))
                                setProjects(projects.filter((x) => x.id !== p.id));
                            }}
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
