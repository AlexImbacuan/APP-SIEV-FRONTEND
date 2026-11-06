import React, { useEffect, useState } from 'react';
import Icon from '../components/landing/Icon';
import SitioHeader from '../components/landing/SitioHeader';
import SitioFooter from '../components/landing/SitioFooter';
import PreguntasFrecuentes from '../components/landing/PreguntasFrecuentes';
import {
  company,
  heroBadges,
  heroFotos,
  services,
  values,
  steps,
  clients,
  logo,
} from '../data/landingContent';
import contenidoServicios from '../data/servicios.json';
import './Landing.css';

// Mínimo de logos por vuelta para que la fila cubra todo el ancho sin dejar huecos
const MINIMO_LOGOS_POR_VUELTA = 8;

/**
 * Carrusel infinito de logos de clientes. La lista se repite hasta llenar el ancho y
 * se duplica para que el desplazamiento no tenga cortes. Solo la primera copia es
 * visible para lectores de pantalla. Para agregar clientes basta con editar `clients`
 * en landingContent.js.
 */
function CarruselClientes({ clientes }) {
  const repeticiones = Math.max(1, Math.ceil(MINIMO_LOGOS_POR_VUELTA / clientes.length));
  const vuelta = Array.from({ length: repeticiones }, () => clientes).flat();

  const lista = (copia) => (
    <ul className="lp-clients__lista" aria-hidden={copia > 0 ? true : undefined}>
      {vuelta.map((c, i) => {
        // Solo la primera aparición de cada cliente se anuncia; las repeticiones son decorativas
        const decorativo = copia > 0 || i >= clientes.length;
        return (
          <li key={`${c.nombre}-${i}`} className={decorativo ? 'lp-clients__repetido' : undefined}>
            {c.logo ? (
              <img
                src={c.logo}
                alt={decorativo ? '' : c.nombre}
                title={c.nombre}
                width={c.ancho}
                height={c.alto}
                loading="lazy"
                style={c.escala ? { '--escala': c.escala } : undefined}
              />
            ) : (
              <span aria-hidden={decorativo ? true : undefined}>{c.nombre}</span>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="lp-clients__carrusel">
      <div className="lp-clients__pista" style={{ '--duracion': `${vuelta.length * 3.5}s` }}>
        {lista(0)}
        {lista(1)}
      </div>
    </div>
  );
}

/**
 * Landing de SIEV.
 * Props:
 *  - onLoginClick (opcional): abre el modal de inicio de sesión.
 *    Si se envía, aparece el botón "Iniciar sesión" en el menú.
 *  - currentUser (opcional): usuario con sesión activa; reemplaza el botón por
 *    el nombre del usuario y "Cerrar sesión".
 *  - onLogout (opcional): cierra la sesión.
 *  - onPanelClick (opcional): lleva al área de módulos ("Mis módulos").
 */
export default function Landing({ onLoginClick, currentUser, onLogout, onPanelClick }) {
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    servicio: '',
    mensaje: '',
  });

  // Menú con sombra al hacer scroll
  // Animación de aparición de secciones
  useEffect(() => {
    const items = document.querySelectorAll('.lp [data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // El formulario abre WhatsApp con el mensaje armado (no requiere backend)
  const handleSubmit = (e) => {
    e.preventDefault();
    const lines = [
      'Hola SIEV, quiero solicitar una cotización.',
      `Nombre: ${form.nombre}`,
      form.empresa && `Empresa: ${form.empresa}`,
      form.telefono && `Teléfono: ${form.telefono}`,
      form.servicio && `Servicio: ${form.servicio}`,
      form.mensaje && `Detalle: ${form.mensaje}`,
    ].filter(Boolean);
    const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="lp">
      <SitioHeader
        onLoginClick={onLoginClick}
        currentUser={currentUser}
        onLogout={onLogout}
        onPanelClick={onPanelClick}
      />

      <main>
        {/* ===== HERO ===== */}
        <section className="lp-hero" id="inicio">
          <div className="lp-hero__grid" aria-hidden="true" />
          <svg className="lp-hero__swoosh" viewBox="0 0 680 520" aria-hidden="true">
            <path d="M46 308 C70 312 92 322 112 338 L200 412 C268 292 360 186 470 112 C536 68 600 40 666 22 C590 60 520 112 456 176 C366 266 290 370 228 486 C220 500 204 500 194 488 Z" />
          </svg>

          <div className="lp-container lp-hero__inner">
            <div className="lp-hero__copy">
              <h1 className="lp-hero__h1">
                <span className="lp-dot" /> Montajes eléctricos, tableros y mantenimiento en Cali,
                Palmira, Yumbo y el Valle del Cauca
              </h1>
              <p className="lp-hero__slogan">
                Energía bien instalada.
                <br />
                <span className="lp-accent">Trabajo bien hecho.</span>
              </p>
              <p className="lp-hero__lead">
                Más de 10 años instalando, fabricando y manteniendo sistemas eléctricos para la
                industria, el comercio y el hogar. Visita técnica y cotización sin costo, con un
                equipo unido y responsable que cumple lo que cotiza.
              </p>
              <div className="lp-hero__actions">
                <a href="#contacto" className="lp-btn lp-btn--primary">
                  Solicitar cotización <Icon name="flecha" size={18} />
                </a>
                <a href="#servicios" className="lp-btn lp-btn--ghost">
                  Ver servicios
                </a>
              </div>
              <ul className="lp-hero__badges">
                {heroBadges.map((b) => (
                  <li key={b}>
                    <Icon name="check" size={16} /> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-hero__visual">
              <div className="lp-hero__collage">
                {heroFotos.map((f, i) => (
                  <img
                    key={f.src}
                    src={f.src}
                    srcSet={f.srcSet}
                    sizes={
                      i === 0
                        ? '(max-width: 600px) 55vw, (max-width: 1024px) 250px, 300px'
                        : '(max-width: 600px) 42vw, (max-width: 1024px) 200px, 240px'
                    }
                    width={f.ancho}
                    height={f.alto}
                    alt={f.alt}
                    className={i === 0 ? 'lp-hero__foto lp-hero__foto--principal' : 'lp-hero__foto'}
                    fetchPriority={i === 0 ? 'high' : undefined}
                  />
                ))}
              </div>
              <div className="lp-hero__card">
                <Icon name="automatizacion" />
                <div>
                  <strong>Automatización industrial</strong>
                  <span>Siemens · Delta</span>
                </div>
              </div>
              <div className="lp-hero__card lp-hero__card--alt">
                <Icon name="escudo" />
                <div>
                  <strong>Seguridad certificada</strong>
                  <span>Altura y espacios confinados</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CLIENTES ===== */}
        <section className="lp-clients" aria-label="Clientes">
          <div className="lp-container lp-clients__inner">
            <span className="lp-clients__label">Empresas que confían en nosotros</span>
            <CarruselClientes clientes={clients} />
          </div>
        </section>

        {/* ===== SERVICIOS ===== */}
        <section className="lp-section" id="servicios">
          <div className="lp-container">
            <div className="lp-section__head" data-reveal>
              <span className="lp-eyebrow">Servicios</span>
              <h2>Soluciones integrales, de la acometida al tablero</h2>
              <p>Todo lo que su planta, negocio u hogar necesita en un solo proveedor eléctrico.</p>
            </div>

            <div className="lp-services">
              {services.map((s) => (
                <article
                  key={s.title}
                  className={`lp-service ${s.featured ? 'lp-service--featured' : ''}`}
                  data-reveal
                >
                  <div className="lp-service__icon">
                    <Icon name={s.icon} size={s.featured ? 30 : 26} />
                  </div>
                  <h3>{s.slug ? <a href={`/servicios/${s.slug}`}>{s.title}</a> : s.title}</h3>
                  <p>{s.desc}</p>
                  {s.slug && (
                    <a href={`/servicios/${s.slug}`} className="lp-link" tabIndex={-1}>
                      Ver servicio <Icon name="flecha" size={16} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== NOSOTROS ===== */}
        <section className="lp-section lp-about" id="nosotros">
          <div className="lp-container lp-about__inner">
            <div className="lp-about__brand" data-reveal>
              <img
                src={logo.src}
                srcSet={logo.srcSet}
                sizes="(max-width: 1024px) 85vw, 440px"
                width={logo.ancho}
                height={logo.alto}
                alt={logo.alt}
                className="lp-about__logo"
                loading="lazy"
              />
            </div>
            <div className="lp-about__copy" data-reveal>
              <span className="lp-eyebrow">Nosotros</span>
              <h2>Un aliado eléctrico para la industria del Valle</h2>
              <p>
                En <strong>{company.name}</strong> acompañamos a plantas de producción, empresas y
                hogares con soluciones eléctricas completas: diseñamos, suministramos, instalamos y
                mantenemos. Trabajamos de la mano del área de mantenimiento de cada cliente para que
                la operación nunca se detenga, con base en Candelaria y atención en Cali, Palmira,
                Yumbo, Jamundí y todo el Valle del Cauca.
              </p>
              <div className="lp-values">
                {values.map((v) => (
                  <div key={v.title} className="lp-value">
                    <span className="lp-value__icon">
                      <Icon name={v.icon} size={22} />
                    </span>
                    <div>
                      <h3>{v.title}</h3>
                      <p>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== PROCESO ===== */}
        <section className="lp-section lp-process" id="proceso">
          <div className="lp-container">
            <div className="lp-section__head lp-section__head--light" data-reveal>
              <span className="lp-eyebrow lp-eyebrow--light">Cómo trabajamos</span>
              <h2>Un proceso claro, sin sorpresas</h2>
            </div>
            <ol className="lp-steps">
              {steps.map((s, i) => (
                <li key={s.title} className="lp-step" data-reveal>
                  <span className="lp-step__num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== PREGUNTAS FRECUENTES ===== */}
        <section className="lp-section lp-section--soft" id="preguntas">
          <div className="lp-container lp-container--narrow">
            <div className="lp-section__head" data-reveal>
              <span className="lp-eyebrow">Preguntas frecuentes</span>
              <h2>Lo que nos preguntan antes de contratar</h2>
            </div>
            <PreguntasFrecuentes preguntas={contenidoServicios.preguntasGenerales} />
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="lp-cta">
          <div className="lp-container lp-cta__inner" data-reveal>
            <div>
              <h2>¿Tiene un proyecto o una falla por resolver?</h2>
              <p>Escríbanos y programamos una visita técnica sin costo.</p>
            </div>
            <a
              className="lp-btn lp-btn--light"
              href={`https://wa.me/${company.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp <Icon name="flecha" size={18} />
            </a>
          </div>
        </section>

        {/* ===== CONTACTO ===== */}
        <section className="lp-section" id="contacto">
          <div className="lp-container lp-contact">
            <div className="lp-contact__info" data-reveal>
              <span className="lp-eyebrow">Contacto</span>
              <h2>Solicite su cotización</h2>
              <p>
                Cuéntenos qué necesita y le respondemos con una propuesta a la medida. Atendemos en
                todo el Valle del Cauca, con horarios ajustados a cada trabajo.
              </p>
              <ul className="lp-contact__list">
                <li>
                  <Icon name="telefono" />
                  <div>
                    <span>Celular</span>
                    {company.phones.map((p) => (
                      <a key={p} href={`tel:+57${p.replace(/\s/g, '')}`}>
                        {p}
                      </a>
                    ))}
                  </div>
                </li>
                <li>
                  <Icon name="correo" />
                  <div>
                    <span>Correo</span>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  </div>
                </li>
                <li>
                  <Icon name="ubicacion" />
                  <div>
                    <span>Dirección</span>
                    <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer">
                      {company.address}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <form className="lp-form" onSubmit={handleSubmit} data-reveal>
              <div className="lp-form__row">
                <label>
                  Nombre *
                  <input name="nombre" value={form.nombre} onChange={handleChange} required />
                </label>
                <label>
                  Empresa
                  <input name="empresa" value={form.empresa} onChange={handleChange} />
                </label>
              </div>
              <div className="lp-form__row">
                <label>
                  Teléfono
                  <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} />
                </label>
                <label>
                  Servicio
                  <select name="servicio" value={form.servicio} onChange={handleChange}>
                    <option value="">Seleccione…</option>
                    {services.map((s) => (
                      <option key={s.title} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Detalle de la necesidad *
                <textarea
                  name="mensaje"
                  rows="4"
                  value={form.mensaje}
                  onChange={handleChange}
                  required
                />
              </label>
              <button type="submit" className="lp-btn lp-btn--primary lp-btn--block">
                Enviar por WhatsApp <Icon name="flecha" size={18} />
              </button>
              <small>Se abrirá WhatsApp con su mensaje listo para enviar.</small>
            </form>
          </div>
        </section>
      </main>

      <SitioFooter />
    </div>
  );
}
