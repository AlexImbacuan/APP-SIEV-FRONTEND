import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { modulosVisibles } from './config/modulos';

function renderApp(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Simula la respuesta JSON del backend para fetch
function mockFetch(estado, cuerpo) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: estado >= 200 && estado < 300,
    status: estado,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(cuerpo),
  });
}

function usuarioCon(rol) {
  return { id: 1, nombre: 'Ana Pérez', email: 'ana@sievsas.com', activo: true, rol, permisos: [] };
}

beforeEach(() => {
  localStorage.clear();
  delete global.fetch;
});

describe('config/modulos', () => {
  const ids = (rol) => modulosVisibles(rol).map((m) => m.id);

  test('cada rol ve solo sus módulos', () => {
    expect(ids('SUPERADMIN')).toEqual(['administracion', 'ventas', 'trabajador', 'admin']);
    expect(ids('SUPERVISOR')).toEqual(['ventas', 'comun']);
    expect(ids('TECNICO')).toEqual(['trabajador', 'comun']);
    expect(ids(null)).toEqual([]);
  });
});

describe('App', () => {
  test('la landing muestra el botón de iniciar sesión', () => {
    renderApp('/');
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('sin sesión, /modulos lleva al login', () => {
    renderApp('/modulos/ventas');
    expect(screen.getByRole('dialog', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('un TECNICO ve solo sus módulos en el inicio', async () => {
    localStorage.setItem('authToken', 'token-de-prueba');
    mockFetch(200, usuarioCon('TECNICO'));
    renderApp('/modulos');

    expect(await screen.findByRole('heading', { name: 'Trabajador' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uso común' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ventas' })).not.toBeInTheDocument();
    expect(screen.getByText('Técnico')).toBeInTheDocument();
  });

  test('un TECNICO que entra a /modulos/ventas ve "No tienes permiso"', async () => {
    localStorage.setItem('authToken', 'token-de-prueba');
    mockFetch(200, usuarioCon('TECNICO'));
    renderApp('/modulos/ventas');

    expect(
      await screen.findByRole('heading', { name: /no tienes permiso para ver este módulo/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toBeInTheDocument();
  });

  test('un usuario sin rol ve el aviso y ningún módulo', async () => {
    localStorage.setItem('authToken', 'token-de-prueba');
    mockFetch(200, usuarioCon(null));
    renderApp('/modulos');

    expect(await screen.findByText(/aún no tiene un rol asignado/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /entrar/i })).not.toBeInTheDocument();
  });

  test('si /me responde 401 al recargar, se cierra la sesión', async () => {
    localStorage.setItem('authToken', 'token-vencido');
    mockFetch(401, { estado: 401, mensaje: 'Token expirado' });
    renderApp('/modulos');

    expect(await screen.findByText(/tu sesión expiró/i)).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
