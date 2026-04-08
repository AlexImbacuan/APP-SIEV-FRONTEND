function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <img src="/logo-siev.ico" alt="Logo SIEV" className="logo-siev" />
      <h1>SIEV</h1>
      <h3>Soluciones Integrales Electricas del valle</h3>
      <p>Esta es una vista de ejemplo con React.</p>
      <button onClick={() => alert('¡Hola desde React!')}>
        Haz clic
      </button>
    </div>
  );
}

export default App;