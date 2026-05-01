import Header from './components/Header';
import ImageRibbon from './components/ImageRibbon';
import './App.css';
import React from 'react';


function App() {
  

  return (
    <div className="site">
      <Header />

      <main className="site-main" id="inicio">
        <section className="hero" aria-labelledby="hero-title">
          <ImageRibbon />
          {/* <h2 id="hero-title">Soluciones Integrales Eléctricas del Valle</h2>
          <p>
            Estructura base de pagina lista para crecer: clara, ordenada y optimizada para escritorio y
            dispositivos moviles.
          </p> */}
        </section>

        

        <section className="content-grid" id="servicios" aria-label="Servicios principales">
          <article className="content-card">
            <h3>Instalaciones</h3>
            <p>Diseno e implementacion de redes electricas residenciales, comerciales e industriales.</p>
          </article>

          <article className="content-card" id="nosotros">
            <h3>Mantenimiento</h3>
            <p>Planes preventivos y correctivos para mejorar continuidad, seguridad y rendimiento.</p>
          </article>

          <article className="content-card" id="contacto">
            <h3>Asesoria tecnica</h3>
            <p>Acompanamiento profesional para normativas, auditorias y optimizacion energetica.</p>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} SIEV. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;