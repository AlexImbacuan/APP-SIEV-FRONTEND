import React, { useEffect, useState } from 'react';
import Icon from '../components/landing/Icon';
import {
  company,
  navLinks,
  heroBadges,
  services,
  values,
  steps,
  clients,
  logo,
} from '../data/landingContent';
import './Landing.css';

/**
 * Landing de SIEV.
 * Props:
 *  - onLoginClick (opcional): función que abre su LoginModal existente.
 *    Si se envía, aparece el botón "Ingresar" en el menú.
 */
export default function Landing({ onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    servicio: '',
    mensaje: '',
  });

  // Menú con sombra al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const closeMenu = () => setMenuOpen(false);
  const year = new Date().getFullYear();

  return (
    <div className="lp">
      {/* ===== MENÚ ===== */}
      <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-container lp-nav__inner">
          <a href="#inicio" className="lp-nav__brand" onClick={closeMenu}>
            <img src={logo.src} alt={logo.alt} className="lp-nav__logo" />
          </a>

          <nav className={`lp-nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Principal">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={closeMenu}>
                {l.label}
              </a>
            ))}
            {onLoginClick && (
              <button
                type="button"
                className="lp-nav__login"
                onClick={() => {
                  closeMenu();
                  onLoginClick();
                }}
              >
                Ingresar
              </button>
            )}
            <a href="#contacto" className="lp-btn lp-btn--primary lp-btn--sm" onClick={closeMenu}>
              Cotizar
            </a>
          </nav>

          <button
            type="button"
            className="lp-nav__toggle"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'cerrar' : 'menu'} />
          </button>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="lp-hero" id="inicio">
          <div className="lp-hero__grid" aria-hidden="true" />
          <svg className="lp-hero__swoosh" viewBox="0 0 680 520" aria-hidden="true">
            <path d="M46 308 C70 312 92 322 112 338 L200 412 C268 292 360 186 470 112 C536 68 600 40 666 22 C590 60 520 112 456 176 C366 266 290 370 228 486 C220 500 204 500 194 488 Z" />
          </svg>

          <div className="lp-container lp-hero__inner">
            <div className="lp-hero__copy" data-reveal>
              <span className="lp-eyebrow lp-eyebrow--light">
                <span className="lp-dot" /> Ingeniería eléctrica · Valle del Cauca
              </span>
              <h1>
                Energía bien instalada.
                <br />
                <span className="lp-accent">Trabajo bien hecho.</span>
              </h1>
              <p className="lp-hero__lead">
                Montajes eléctricos, tableros, automatización y mantenimiento para la industria, el
                comercio y el hogar. Un equipo unido y responsable que cumple lo que cotiza.
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

            <div className="lp-hero__visual" data-reveal>
              <div className="lp-hero__frame">
                <img src={logo.src} alt={logo.alt} />
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
            <ul>
              {clients.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
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
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  {s.featured && (
                    <a href="#contacto" className="lp-link">
                      Cotizar este servicio <Icon name="flecha" size={16} />
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
              <img src={logo.src} alt={logo.alt} className="lp-about__logo" />
            </div>
            <div className="lp-about__copy" data-reveal>
              <span className="lp-eyebrow">Nosotros</span>
              <h2>Un aliado eléctrico para la industria del Valle</h2>
              <p>
                En <strong>{company.name}</strong> acompañamos a plantas de producción, empresas y
                hogares con soluciones eléctricas completas: diseñamos, suministramos, instalamos y
                mantenemos. Trabajamos de la mano del área de mantenimiento de cada cliente para que
                la operación nunca se detenga.
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

        {/* ===== CTA ===== */}
        <section className="lp-cta">
          <div className="lp-container lp-cta__inner" data-reveal>
            <div>
              <h2>¿Tiene un proyecto o una falla por resolver?</h2>
              <p>Escríbanos y programamos una visita técnica.</p>
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
              <p>Cuéntenos qué necesita y le respondemos con una propuesta a la medida.</p>
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

      {/* ===== PIE ===== */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <img src={logo.src} alt={logo.alt} className="lp-footer__logo" />
            <p>NIT {company.nit}</p>
          </div>
          <div>
            <h4>Navegación</h4>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div>
            <h4>Contacto</h4>
            <span>Tel. {company.landline}</span>
            {company.phones.map((p) => (
              <span key={p}>Cel. {p}</span>
            ))}
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <span>{company.address}</span>
          </div>
        </div>
        <div className="lp-container lp-footer__bottom">
          © {year} {company.name}. Todos los derechos reservados.
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        className="lp-whatsapp"
        href={`https://wa.me/${company.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.3 3.4 14.7 14.7 0 0 0 5.7 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.2-.3-.3-.6-.5Z" />
        </svg>
      </a>
    </div>
  );
}
