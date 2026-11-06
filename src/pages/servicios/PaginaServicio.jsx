import React from 'react';
import Icon from '../../components/landing/Icon';
import SitioHeader from '../../components/landing/SitioHeader';
import SitioFooter from '../../components/landing/SitioFooter';
import PreguntasFrecuentes from '../../components/landing/PreguntasFrecuentes';
import { company, steps } from '../../data/landingContent';
import contenido from '../../data/servicios.json';

const { servicios, ciudades, ventajas } = contenido;

/** srcSet de una foto a partir de su ruta base y sus anchos (archivos -400.webp, -800.webp…). */
export function srcSetFoto(foto) {
  return foto.anchos.map((w) => `${foto.base}-${w}.webp ${w}w`).join(', ');
}

/**
 * Página de un servicio (p. ej. /servicios/tableros-electricos).
 * No usa hooks de sesión ni del router: así se puede convertir también en HTML
 * estático al compilar (scripts/prerender.js) para Google y los asistentes de IA.
 * Props: servicio (de servicios.json) y las props opcionales del menú (SitioHeader).
 */
export default function PaginaServicio({ servicio, ...propsMenu }) {
  const whatsapp = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(
    `Hola SIEV, quiero cotizar: ${servicio.nombre}.`,
  )}`;
  const telefono = `tel:+57${company.phones[0].replace(/\s/g, '')}`;
  const nombreMinuscula = servicio.nombre.charAt(0).toLowerCase() + servicio.nombre.slice(1);
  const otros = servicios.filter((s) => s.slug !== servicio.slug);
  const { foto } = servicio;

  return (
    <div className="lp sp">
      <SitioHeader {...propsMenu} cotizarHref="#cotizar" />

      <main>
        {/* ===== ENCABEZADO ===== */}
        <section className="lp-hero sp-hero">
          <div className="lp-hero__grid" aria-hidden="true" />
          <div className="lp-container sp-hero__inner">
            <div>
              <nav aria-label="Ruta de navegación" className="sp-migas">
                <ol>
                  <li>
                    <a href="/">Inicio</a>
                  </li>
                  <li>
                    <a href="/#servicios">Servicios</a>
                  </li>
                  <li aria-current="page">{servicio.nombre}</li>
                </ol>
              </nav>
              <h1 className="sp-h1">{servicio.h1}</h1>
              {servicio.intro.map((p) => (
                <p key={p} className="lp-hero__lead sp-lead">
                  {p}
                </p>
              ))}
              <div className="lp-hero__actions">
                <a
                  href={whatsapp}
                  className="lp-btn lp-btn--primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cotizar por WhatsApp <Icon name="flecha" size={18} />
                </a>
                <a href={telefono} className="lp-btn lp-btn--ghost">
                  Llamar {company.phones[0]}
                </a>
              </div>
              <ul className="lp-hero__badges">
                {ventajas.slice(0, 2).map((v) => (
                  <li key={v}>
                    <Icon name="check" size={16} /> {v}
                  </li>
                ))}
              </ul>
            </div>
            <img
              className="sp-hero__foto"
              src={`${foto.base}-${foto.ancho}.webp`}
              srcSet={srcSetFoto(foto)}
              sizes="(max-width: 1024px) 90vw, 420px"
              width={foto.ancho}
              height={foto.alto}
              alt={foto.alt}
              fetchPriority="high"
            />
          </div>
        </section>

        {/* ===== QUÉ INCLUYE ===== */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section__head">
              <span className="lp-eyebrow">Qué incluye</span>
              <h2>{servicio.nombre}: qué hacemos</h2>
              <p>{servicio.resumen}</p>
            </div>
            <div className="sp-items">
              {servicio.incluye.map((item) => (
                <article key={item.titulo} className="sp-item">
                  <span className="sp-item__icon">
                    <Icon name={servicio.icono} size={22} />
                  </span>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PARA QUIÉN / POR QUÉ SIEV ===== */}
        <section className="lp-section lp-section--soft">
          <div className="lp-container sp-dos">
            <div>
              <h2 className="sp-h2">¿Para quién es este servicio?</h2>
              <ul className="sp-lista">
                {servicio.paraQuien.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={18} /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="sp-h2">¿Por qué SIEV?</h2>
              <ul className="sp-lista">
                {ventajas.map((v) => (
                  <li key={v}>
                    <Icon name="check" size={18} /> {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ===== CÓMO TRABAJAMOS ===== */}
        <section className="lp-section lp-process">
          <div className="lp-container">
            <div className="lp-section__head lp-section__head--light">
              <span className="lp-eyebrow lp-eyebrow--light">Cómo trabajamos</span>
              <h2>Un proceso claro, sin sorpresas</h2>
            </div>
            <ol className="lp-steps">
              {steps.map((s, i) => (
                <li key={s.title} className="lp-step">
                  <span className="lp-step__num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== COBERTURA ===== */}
        <section className="lp-section">
          <div className="lp-container lp-container--narrow">
            <div className="lp-section__head">
              <span className="lp-eyebrow">Cobertura</span>
              <h2>{servicio.nombre} en Cali, Palmira, Yumbo y todo el Valle del Cauca</h2>
              <p>
                Tenemos sede en Villagorgona (Candelaria) y nos desplazamos a su planta, bodega o
                local en cualquier municipio del Valle del Cauca. La visita técnica y la cotización
                no tienen costo.
              </p>
            </div>
            <ul className="sp-ciudades">
              {ciudades.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== PREGUNTAS FRECUENTES ===== */}
        <section className="lp-section lp-section--soft">
          <div className="lp-container lp-container--narrow">
            <div className="lp-section__head">
              <span className="lp-eyebrow">Preguntas frecuentes</span>
              <h2>Preguntas sobre {nombreMinuscula}</h2>
            </div>
            <PreguntasFrecuentes preguntas={servicio.preguntas} />
          </div>
        </section>

        {/* ===== OTROS SERVICIOS ===== */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section__head">
              <span className="lp-eyebrow">Otros servicios</span>
              <h2>También le podemos ayudar con</h2>
            </div>
            <div className="sp-otros">
              {otros.map((s) => (
                <a key={s.slug} href={`/servicios/${s.slug}`} className="sp-otro">
                  <span className="sp-item__icon">
                    <Icon name={s.icono} size={22} />
                  </span>
                  <strong>{s.nombre}</strong>
                  <span>{s.resumen}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ===== LLAMADA A LA ACCIÓN ===== */}
        <section className="lp-cta" id="cotizar">
          <div className="lp-container lp-cta__inner">
            <div>
              <h2>¿Necesita {nombreMinuscula}?</h2>
              <p>Escríbanos y programamos una visita técnica sin costo.</p>
            </div>
            <a
              className="lp-btn lp-btn--light"
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cotizar por WhatsApp <Icon name="flecha" size={18} />
            </a>
          </div>
        </section>
      </main>

      <SitioFooter />
    </div>
  );
}
