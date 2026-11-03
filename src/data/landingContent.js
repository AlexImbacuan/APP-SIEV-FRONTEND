/**
 * Contenido editable de la landing de SIEV.
 * Cambie aquí textos, servicios, clientes e imágenes sin tocar el diseño.
 */

export const company = {
  name: 'Soluciones Integrales Eléctricas del Valle S.A.S.',
  short: 'SIEV',
  nit: '900.887.302-0',
  address: 'Cra 3A # 14-117, Villagorgona, Candelaria, Valle del Cauca',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Cra+3A+14-117+Villagorgona+Candelaria+Valle',
  phones: ['318 309 0738', '314 637 2034'],
  landline: '260 7109',
  email: 'sie.delvalle@hotmail.com',
  // Número de WhatsApp con indicativo de país, sin espacios ni "+"
  whatsapp: '573183090738',
};

export const navLinks = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#contacto', label: 'Contacto' },
];

export const heroBadges = [
  'Baja y media tensión',
  'Automatización Siemens · Delta',
  'Trabajo en altura y espacios confinados',
];

export const services = [
  {
    icon: 'rayo',
    title: 'Montajes eléctricos en baja y media tensión',
    desc: 'Acometidas, redes, subestaciones y montajes industriales ejecutados con normativa vigente y personal calificado.',
    featured: true,
  },
  {
    icon: 'tablero',
    title: 'Tableros eléctricos',
    desc: 'Armado, cableado, modernización y mantenimiento de tableros de distribución, control y fuerza.',
  },
  {
    icon: 'automatizacion',
    title: 'Automatización industrial',
    desc: 'Programación e integración con PLC, variadores y HMI Siemens y Delta.',
  },
  {
    icon: 'iluminacion',
    title: 'Proyectos de iluminación',
    desc: 'Diseño e instalación de iluminación interior, exterior e industrial eficiente.',
  },
  {
    icon: 'factor',
    title: 'Corrección de factor de potencia',
    desc: 'Estudio, bancos de condensadores y control para reducir penalizaciones por energía reactiva.',
  },
  {
    icon: 'bandeja',
    title: 'Bandejas portacables y tubería',
    desc: 'Canalizaciones ordenadas y seguras en bandeja, tubería EMT, IMC y PVC.',
  },
  {
    icon: 'mantenimiento',
    title: 'Mantenimiento preventivo',
    desc: 'Rutinas programadas, termografía, ajustes y limpieza para evitar paros no planeados.',
  },
  {
    icon: 'planos',
    title: 'Planos y diseño eléctrico',
    desc: 'Levantamientos, diagramas unifilares y planos de proyectos eléctricos.',
  },
  {
    icon: 'planta',
    title: 'Alquiler de plantas eléctricas',
    desc: 'Respaldo de energía para obras, eventos y contingencias en planta.',
  },
  {
    icon: 'suministro',
    title: 'Suministro de materiales',
    desc: 'Material eléctrico para proyectos residenciales, comerciales e industriales.',
  },
  {
    icon: 'altura',
    title: 'Trabajo en altura y espacios confinados',
    desc: 'Personal certificado y protocolos de seguridad para tareas de alto riesgo.',
  },
];

export const values = [
  {
    icon: 'escudo',
    title: 'Seguridad primero',
    desc: 'Cada trabajo se planea con análisis de riesgos, EPP y procedimientos certificados.',
  },
  {
    icon: 'equipo',
    title: 'Un equipo unido y responsable',
    desc: 'Técnicos y supervisores que responden por el resultado de principio a fin.',
  },
  {
    icon: 'reloj',
    title: 'Cumplimiento',
    desc: 'Cronogramas claros y comunicación constante con el área de mantenimiento del cliente.',
  },
];

export const steps = [
  {
    title: 'Visita técnica',
    desc: 'Evaluamos en sitio la necesidad, el alcance y las condiciones de seguridad.',
  },
  {
    title: 'Cotización',
    desc: 'Enviamos una propuesta detallada con materiales, mano de obra y tiempos.',
  },
  {
    title: 'Ejecución',
    desc: 'Con la orden de compra aprobada, nuestro equipo realiza el trabajo según lo pactado.',
  },
  {
    title: 'Entrega y soporte',
    desc: 'Pruebas, informe del trabajo realizado y acompañamiento posterior.',
  },
];

// Única imagen de la landing: el logo de /public/images (se muestra en la portada).
export const logo = {
  src: '/images/logo-SIEV.png',
  alt: 'SIEV - Soluciones Integrales Eléctricas del Valle S.A.S.',
};

export const clients = [
  'Cargill',
  'Pollos El Bucanero',
  'Avícola Pollo Listo',
  'Agrograin',
  'Savicol',
];
