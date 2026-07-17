import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from '../../services/projectService';
import './ProjectsSection.css';

const emptyProjectForm = {
  serialProyecto: '',
  descripcionGlobal: '',
  valorTotal: '',
  factura: '',
  pago: '',
  observacion: '',
};

function normalizeProjectList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.proyectos)) return response.proyectos;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function getProjectIdentifier(project) {
  return project?.id ?? project?.serial ?? project?.serialProyecto ?? '';
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectMessage, setProjectMessage] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [deleteTargetProject, setDeleteTargetProject] = useState(null);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) => {
      const serial = String(project?.serial ?? project?.serialProyecto ?? '').toLowerCase();
      const descripcion = String(project?.descripcionGlobal ?? '').toLowerCase();
      const factura = String(project?.factura ?? '').toLowerCase();
      const observacion = String(project?.observacion ?? '').toLowerCase();

      return [serial, descripcion, factura, observacion].some((value) => value.includes(query));
    });
  }, [projectSearch, projects]);

  const loadProjects = useCallback(async () => {
    setProjectLoading(true);
    setProjectMessage('');

    try {
      const response = await getProjects();
      setProjects(normalizeProjectList(response));
    } catch (error) {
      setProjectMessage(`No se pudieron cargar los proyectos: ${error.message}`);
    } finally {
      setProjectLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();

    const serial = projectForm.serialProyecto.trim();
    if (!serial) {
      setProjectMessage('Ingrese Serial de proyecto');
      return;
    }

    const payload = {
      serial,
      descripcionGlobal: projectForm.descripcionGlobal.trim(),
      valorTotal: Number(projectForm.valorTotal || 0),
      factura: Number(projectForm.factura || 0),
      pago: projectForm.pago === 'true',
      observacion: projectForm.observacion.trim(),
    };

    setProjectSaving(true);
    setProjectMessage('');

    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, payload);
        setProjects((prev) =>
          prev.map((project) => {
            const identifier = getProjectIdentifier(project);
            return identifier === editingProjectId ? { ...project, ...payload } : project;
          }),
        );
      } else {
        const response = await createProject(payload);
        const createdProject = response?.data || response;

        if (
          createdProject &&
          typeof createdProject === 'object' &&
          !Array.isArray(createdProject)
        ) {
          setProjects((prev) => [createdProject, ...prev]);
        } else {
          await loadProjects();
        }
      }

      setProjectForm(emptyProjectForm);
      setShowProjectForm(false);
      setEditingProjectId(null);
      setProjectMessage('Proyecto registrado correctamente.');
    } catch (error) {
      setProjectMessage(`Error al enviar proyecto: ${error.message}`);
    } finally {
      setProjectSaving(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProjectId(getProjectIdentifier(project));
    setProjectForm({
      serialProyecto: project?.serial ?? project?.serialProyecto ?? '',
      descripcionGlobal: project?.descripcionGlobal ?? '',
      valorTotal: String(project?.valorTotal ?? project?.totalGeneral ?? ''),
      factura: String(project?.factura ?? ''),
      pago: String(project?.pago ?? ''),
      observacion: project?.observacion ?? '',
    });
    setShowProjectForm(true);
    setProjectMessage('');
  };

  const handleDeleteProject = async () => {
    if (!deleteTargetProject) return;

    const identifier = getProjectIdentifier(deleteTargetProject);
    if (!identifier) {
      setProjectMessage('No se encontró identificador para eliminar el proyecto.');
      setDeleteTargetProject(null);
      return;
    }

    setProjectSaving(true);
    setProjectMessage('');

    try {
      await deleteProject(identifier);
      setProjects((prev) => prev.filter((project) => getProjectIdentifier(project) !== identifier));
      setDeleteTargetProject(null);
      setProjectMessage('Proyecto eliminado correctamente.');
    } catch (error) {
      setProjectMessage(`Error al eliminar proyecto: ${error.message}`);
    } finally {
      setProjectSaving(false);
    }
  };

  const handleProjectCancel = () => {
    setShowProjectForm(false);
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
  };

  return (
    <div className="projects-section">
      <div className="section-header">
        <h2>Proyectos Registrados</h2>
        <div className="section-header__meta">
          <span className="activity-count">{filteredProjects.length} total</span>
          <button
            className="cta-button"
            onClick={() => {
              setShowProjectForm(true);
              setEditingProjectId(null);
              setProjectForm(emptyProjectForm);
              setProjectMessage('');
            }}
          >
            ➕ Crear Proyecto
          </button>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar serial, factura u observación..."
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {projectMessage && <div className="form-message">{projectMessage}</div>}

      {showProjectForm && (
        <div className="projects-form-card">
          <form className="activity-form" onSubmit={handleProjectSubmit}>
            <div className="form-group">
              <label>Serial *</label>
              <input
                type="text"
                value={projectForm.serialProyecto}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, serialProyecto: e.target.value }))
                }
                placeholder="PR-001"
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
                placeholder="Instalación eléctrica edificio A"
              />
            </div>

            <div className="project-grid-two">
              <div className="form-group">
                <label>Valor total</label>
                <input
                  type="number"
                  value={projectForm.valorTotal}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, valorTotal: e.target.value }))
                  }
                  step="0.01"
                  placeholder="3500000"
                />
              </div>

              <div className="form-group">
                <label>Factura</label>
                <input
                  type="number"
                  value={projectForm.factura}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, factura: e.target.value }))}
                  placeholder="1205"
                />
              </div>
            </div>

            <div className="project-grid-two">
              <div className="form-group">
                <label>Pago</label>
                <select
                  value={projectForm.pago}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, pago: e.target.value }))}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observación</label>
                <textarea
                  value={projectForm.observacion}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, observacion: e.target.value }))
                  }
                  rows="2"
                  placeholder="Pendiente de revisión"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={projectSaving}>
                {projectSaving
                  ? 'Guardando...'
                  : editingProjectId
                    ? '💾 Actualizar Proyecto'
                    : '➕ Registrar Proyecto'}
              </button>
              <button type="button" className="cancel-button" onClick={handleProjectCancel}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-list-area">
        {projectLoading ? (
          <div className="empty-state">
            <p>Cargando proyectos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>No hay proyectos registrados aún</p>
            <button onClick={() => setShowProjectForm(true)} className="cta-button">
              Crear Primer Proyecto
            </button>
          </div>
        ) : (
          <div className="projects-table-wrapper">
            <table className="projects-table">
              <thead>
                <tr>
                  <th className="col-serial">Serial</th>
                  <th className="col-description">Descripción</th>
                  <th className="col-value">Valor total</th>
                  <th className="col-invoice">Factura</th>
                  <th className="col-payment">Pago</th>
                  <th className="col-observation">Observación</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  const serial =
                    project?.serial ?? project?.serialProyecto ?? `Proyecto ${index + 1}`;
                  const valorTotal = project?.valorTotal ?? project?.totalGeneral ?? '—';
                  const descripcion = project?.descripcionGlobal ?? '—';
                  const factura = project?.factura ?? '—';
                  const pago = project?.pago;
                  const observacion = project?.observacion ?? '—';

                  return (
                    <tr key={getProjectIdentifier(project) || index}>
                      <td className="col-serial">{serial}</td>
                      <td className="col-description">{descripcion}</td>
                      <td className="col-value">{valorTotal}</td>
                      <td className="col-invoice">{factura}</td>
                      <td className="col-payment">
                        {String(pago) === 'true' || pago === true ? 'Sí' : 'No'}
                      </td>
                      <td className="col-observation">{observacion}</td>
                      <td className="col-actions">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEditProject(project)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => setDeleteTargetProject(project)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTargetProject && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
          >
            <h3 id="delete-project-title">Eliminar proyecto</h3>
            <p>
              ¿Seguro que deseas eliminar el proyecto{' '}
              <strong>
                {deleteTargetProject?.serial ??
                  deleteTargetProject?.serialProyecto ??
                  'seleccionado'}
              </strong>
              ?
            </p>
            <p className="confirm-modal-copy">Esta acción no se puede deshacer.</p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setDeleteTargetProject(null)}
                disabled={projectSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="delete-button"
                onClick={handleDeleteProject}
                disabled={projectSaving}
              >
                {projectSaving ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
