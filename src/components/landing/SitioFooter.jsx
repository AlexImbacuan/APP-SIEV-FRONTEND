import React from 'react';
import { company, navLinks, logo } from '../../data/landingContent';
import contenido from '../../data/servicios.json';

const { servicios } = contenido;

/** Pie de página del sitio público y botón flotante de WhatsApp. */
export default function SitioFooter() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <img
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="240px"
              width={logo.ancho}
              height={logo.alto}
              alt={logo.alt}
              className="lp-footer__logo"
              loading="lazy"
            />
            <p>NIT {company.nit}</p>
            <p>Más de 10 años de experiencia en el Valle del Cauca.</p>
          </div>
          <div>
            <h3>Servicios</h3>
            {servicios.map((s) => (
              <a key={s.slug} href={`/servicios/${s.slug}`}>
                {s.nombre}
              </a>
            ))}
          </div>
          <div>
            <h3>Navegación</h3>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div>
            <h3>Contacto</h3>
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
    </>
  );
}
