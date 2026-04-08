function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bienvenido a mi app Siev</h1>
      <p>Esta es una vista de ejemplo con React.</p>
      <button onClick={() => alert('¡Hola desde React!')}>
        Haz clic
      </button>
    </div>
  );
}

export default App;