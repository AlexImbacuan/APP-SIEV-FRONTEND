/**
 * Prerenderizado del sitio público (se ejecuta después de `react-scripts build`).
 *
 * Convierte la portada y cada página de servicio en HTML ya armado, con su propio
 * <title>, descripción, URL canónica, vista previa para redes y datos estructurados.
 * Así Google, WhatsApp y los asistentes de IA (que muchas veces no ejecutan
 * JavaScript) leen el contenido completo. Al cargar, React toma el control normal.
 *
 * Genera:
 *   build/index.html                      portada
 *   build/app.html                        app sin contenido prearmado (login y panel)
 *   build/servicios/<slug>.html           una página por servicio (src/data/servicios.json)
 *   build/sitemap.xml                     mapa del sitio con todas las páginas públicas
 *
 * No usa librerías nuevas: Babel y su preset vienen con react-scripts.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const BUILD = path.join(RAIZ, 'build');
const SITIO = 'https://sievsas.com';

// ---------- Permitir `require` de los componentes (JSX y módulos ES) ----------
// En modo "test" el preset de CRA convierte los módulos a CommonJS para Node.
// NODE_ENV también en "test" para que React use el mismo runtime de JSX que genera Babel.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
const babel = require('@babel/core');

const compilarDesdeSrc = (modulo, archivo) => {
  if (!archivo.startsWith(SRC)) {
    return Module._extensions['.js.original'](modulo, archivo);
  }
  const { code } = babel.transformFileSync(archivo, {
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]],
  });
  return modulo._compile(code, archivo);
};
Module._extensions['.js.original'] = Module._extensions['.js'];
Module._extensions['.js'] = compilarDesdeSrc;
Module._extensions['.jsx'] = compilarDesdeSrc;
Module._extensions['.css'] = () => {}; // los estilos ya están en el CSS del build

const React = require('react');
const { renderToString } = require('react-dom/server');
const Landing = require(path.join(SRC, 'pages/Landing.jsx')).default;
const PaginaServicio = require(path.join(SRC, 'pages/servicios/PaginaServicio.jsx')).default;
const contenido = require(path.join(SRC, 'data/servicios.json'));

// ---------- Utilidades ----------
const escaparAtributo = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const escaparTexto = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Reemplaza el valor de un atributo en la etiqueta que coincide con `selector`. */
function cambiarMeta(html, selector, atributo, valor) {
  const regex = new RegExp(`(<[^>]*${selector}[^>]*${atributo}=")[^"]*(")`);
  if (!regex.test(html)) throw new Error(`No se encontró ${selector} en index.html`);
  return html.replace(regex, `$1${escaparAtributo(valor)}$2`);
}

function jsonLd(datos) {
  // "<" escapado para que el JSON no pueda cerrar la etiqueta <script>
  return `<script type="application/ld+json">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>`;
}

const faqLd = (preguntas, url) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${url}#preguntas`,
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
});

/** Arma una página a partir del index.html del build. */
function armarPagina(plantilla, { titulo, descripcion, url, contenidoHtml, datos }) {
  let html = plantilla;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escaparTexto(titulo)}</title>`);
  html = cambiarMeta(html, 'name="description"', 'content', descripcion);
  html = cambiarMeta(html, 'rel="canonical"', 'href', url);
  html = cambiarMeta(html, 'property="og:url"', 'content', url);
  html = cambiarMeta(html, 'property="og:title"', 'content', titulo);
  html = cambiarMeta(html, 'property="og:description"', 'content', descripcion);
  html = cambiarMeta(html, 'name="twitter:title"', 'content', titulo);
  html = cambiarMeta(html, 'name="twitter:description"', 'content', descripcion);
  html = html.replace('</head>', `${datos.map(jsonLd).join('')}</head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error('No se encontró <div id="root">');
  return html.replace('<div id="root"></div>', `<div id="root">${contenidoHtml}</div>`);
}

// ---------- Generación ----------
const plantilla = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
const leer = (re) => {
  const m = plantilla.match(re);
  if (!m) throw new Error(`No se encontró ${re} en index.html`);
  return m[1];
};
const tituloInicio = leer(/<title>([^<]*)<\/title>/);

// Copia sin contenido prearmado para el login y el panel (ver netlify.toml)
fs.writeFileSync(
  path.join(BUILD, 'app.html'),
  cambiarMeta(plantilla, 'name="robots"', 'content', 'noindex'),
);
console.log('  app.html (login y panel)');

const descripcionInicio = leer(/name="description"[^>]*content="([^"]*)"/);

// Portada
fs.writeFileSync(
  path.join(BUILD, 'index.html'),
  armarPagina(plantilla, {
    titulo: tituloInicio,
    descripcion: descripcionInicio,
    url: `${SITIO}/`,
    contenidoHtml: renderToString(React.createElement(Landing)),
    datos: [faqLd(contenido.preguntasGenerales, `${SITIO}/`)],
  }),
);
console.log('  /  (portada)');

// Servicios
fs.mkdirSync(path.join(BUILD, 'servicios'), { recursive: true });
for (const servicio of contenido.servicios) {
  const url = `${SITIO}/servicios/${servicio.slug}`;
  const datos = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#servicio`,
      name: servicio.nombre,
      serviceType: servicio.nombre,
      description: servicio.descripcionSeo,
      url,
      image: `${SITIO}${servicio.foto.base}-${servicio.foto.ancho}.webp`,
      provider: { '@id': `${SITIO}/#empresa` },
      areaServed: [
        ...contenido.ciudades.map((c) => ({ '@type': 'City', name: c })),
        { '@type': 'AdministrativeArea', name: 'Valle del Cauca' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: servicio.nombre,
        itemListElement: servicio.incluye.map((i) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: i.titulo, description: i.texto },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
        { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${SITIO}/#servicios` },
        { '@type': 'ListItem', position: 3, name: servicio.nombre, item: url },
      ],
    },
    faqLd(servicio.preguntas, url),
  ];

  fs.writeFileSync(
    path.join(BUILD, 'servicios', `${servicio.slug}.html`),
    armarPagina(plantilla, {
      titulo: servicio.tituloSeo,
      descripcion: servicio.descripcionSeo,
      url,
      contenidoHtml: renderToString(React.createElement(PaginaServicio, { servicio })),
      datos,
    }),
  );
  console.log(`  /servicios/${servicio.slug}`);
}

// Mapa del sitio
const hoy = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITIO}/`, prioridad: '1.0' },
  ...contenido.servicios.map((s) => ({
    loc: `${SITIO}/servicios/${s.slug}`,
    prioridad: '0.8',
  })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/prerender.js al compilar: no editar a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${hoy}</lastmod>\n    <priority>${u.prioridad}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), sitemap);
console.log(`  sitemap.xml (${urls.length} páginas)`);
console.log('Prerenderizado listo.');
