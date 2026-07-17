import { apiRequest } from './apiClient';

const REPORTS_ENDPOINT =
  process.env.REACT_APP_PROJECTS_ENDPOINT ||
  process.env.REACT_APP_REPORTS_ENDPOINT ||
  'https://app-siev-backend.onrender.com/api/proyectos';

export async function createProjectReport(reportPayload) {
  // apiRequest will stringify plain objects and set appropriate headers
  return apiRequest(REPORTS_ENDPOINT, {
    method: 'POST',
    body: reportPayload,
    timeout: 60000,
  });
}
