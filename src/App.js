import './App.css';

function App() {
  const openMail = () => {
    window.location.href = 'https://eliezer.colombiahosting.com.co:2096/logout/?locale=es';
  };

  return (
    <main className="app-shell">
      <div className="grid-overlay" aria-hidden="true" />

      <section className="enterprise-card">
        <header className="card-header">
          <span className="status-pill">Portal corporativo</span>
          <span className="company-tag">SIEV</span>
        </header>

        <h1 className="title-siev">Soluciones Integrales Electricas del Valle</h1>
        <p className="subtitle-siev">
          Plataforma de acceso a servicios internos para operaciones tecnicas y administrativas.
        </p>

        <div className="info-row" aria-hidden="true">
          <div className="info-item">
            <span className="info-label">Sector</span>
            <strong>Servicios electricos</strong>
          </div>
          <div className="info-item">
            <span className="info-label">Acceso</span>
            <strong>Correo institucional</strong>
          </div>
        </div>

        <button className="mail-button" onClick={openMail}>
          Abrir correo SIEV
        </button>
      </section>
    </main>
  );
}

export default App;