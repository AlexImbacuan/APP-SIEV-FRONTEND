import { apiRequest } from './apiClient';

const PROJECTS_ENDPOINT =
  process.env.REACT_APP_PROJECTS_ENDPOINT || 'https://app-siev-backend.onrender.com/api/proyectos';

function buildProjectUrl(identifier) {
  if (identifier === undefined || identifier === null || identifier === '') {
    return PROJECTS_ENDPOINT;
  }

  return `${PROJECTS_ENDPOINT}/${encodeURIComponent(identifier)}`;
}

export async function getProjects() {
  return apiRequest(PROJECTS_ENDPOINT, {
    method: 'GET',
    timeout: 30000,
  });
}

export async function createProject(projectPayload) {
  return apiRequest(PROJECTS_ENDPOINT, {
    method: 'POST',
    body: projectPayload,
    timeout: 60000,
  });
}

export async function updateProject(identifier, projectPayload) {
  return apiRequest(buildProjectUrl(identifier), {
    method: 'PUT',
    body: projectPayload,
    timeout: 60000,
  });
}

export async function deleteProject(identifier) {
  return apiRequest(buildProjectUrl(identifier), {
    method: 'DELETE',
    timeout: 30000,
  });
}
