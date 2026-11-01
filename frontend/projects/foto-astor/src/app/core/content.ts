// Contenido de la demo. Marca, personas, lugares, reseñas y precios son ficticios.

export const BRAND = {
  name: 'Astor',
  person: 'Emilio Astor',
  role: 'Fotógrafo de bodas y eventos sociales',
  city: 'Aguascalientes',
  // Se muestran como texto (sin enlaces tel:) para no marcar a números reales.
  phone: '(449) 287 51 64',
  email: 'hola@astorfoto.mx',
  instagram: '@astor.foto',
  web: 'astorfoto.mx',
  address: 'Juan de Montoro 318, Zona Centro',
  hours: 'Lunes a viernes · 10:00 a 19:00',
  since: 2017,
  portfolio: 'https://portafolio-web-chi-ten.vercel.app',
};

/** Lugares y planners con los que "ha trabajado" (nombres inventados). La fuente varía como en un muro de logos. */
export type VenueLogo = 'arches' | 'vine' | 'moons' | 'flower' | 'tree' | 'monogram' | 'flame';
export const VENUES: {
  name: string;
  kind: string;
  style: 'serif' | 'italic' | 'script' | 'caps' | 'condensed';
  /** Logotipo propio (los que no tienen se muestran solo con su tipografía). */
  logo?: VenueLogo;
  /** Cómo se acomoda el logo: arriba del nombre, a un lado, o sello circular. */
  layout?: 'stack' | 'inline' | 'seal';
}[] = [
  { name: 'Hacienda Los Arcos', kind: 'Recepciones', style: 'caps', logo: 'arches', layout: 'stack' },
  { name: 'Viñedo Cielo Rojo', kind: 'Bodas en viñedo', style: 'italic', logo: 'vine', layout: 'inline' },
  { name: 'Casona Tres Lunas', kind: 'Eventos', style: 'serif', logo: 'moons', layout: 'stack' },
  { name: 'Bugambilia', kind: 'Wedding planner', style: 'script', logo: 'flower', layout: 'inline' },
  { name: 'Jardín El Mezquite', kind: 'Jardín de eventos', style: 'condensed', logo: 'tree', layout: 'seal' },
  { name: 'Salón Cristal', kind: 'Salón', style: 'caps' },
  { name: 'Flor de Sal', kind: 'Floristería', style: 'italic' },
  { name: 'Quinta Alameda', kind: 'Quinta', style: 'serif', logo: 'monogram', layout: 'inline' },
  { name: 'Velaria', kind: 'Ambientación', style: 'script', logo: 'flame', layout: 'inline' },
  { name: 'Terraza Mirador', kind: 'Terraza', style: 'condensed' },
];

/** Pie escrito a mano de cada foto de la mesa: quiénes y dónde. */
const COUPLES = ['Ana & Luis', 'Sofía & Diego', 'Mariana & Andrés', 'Fer & Pablo', 'Valeria & Iván', 'Daniela & Jorge', 'Regina & Tomás', 'Paula & Emiliano', 'Lucía & Rodrigo', 'Ximena & Carlos', 'Renata & Mauricio', 'Camila & Héctor'];
const QUINCE = ['Regina', 'Valentina', 'Ximena', 'Romina', 'Camila', 'Natalia', 'Fernanda', 'Itzel', 'Paola', 'Montserrat'];
const SOCIAL = ['Bautizo de Mateo', 'Comunión de Emma', 'Graduación UAA', 'Brindis de los Ruiz', 'Bautizo de Leo', 'Graduación 2025', 'Aniversario 25', 'Comunión de Sofi'];
const PLACES = ['Hacienda Los Arcos', 'Viñedo Cielo Rojo', 'Casona Tres Lunas', 'Jardín El Mezquite', 'Salón Cristal', 'Quinta Alameda', 'Terraza Mirador', 'Centro de Ags'];

export function captionFor(name: string, cat: string, index: number): { who: string; where: string } {
  const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) + index;
  const year = 2019 + (h % 7);
  const where = `${PLACES[h % PLACES.length]} · ${year}`;
  if (cat === 'xv') return { who: `XV · ${QUINCE[h % QUINCE.length]}`, where };
  if (cat === 'social') return { who: SOCIAL[h % SOCIAL.length], where };
  return { who: COUPLES[h % COUPLES.length], where };
}

export interface Service {
  id: 'bodas' | 'xv' | 'social';
  title: string;
  script: string;
  text: string;
  from: number;
  photos: string[];
  tags: string[];
}

export const SERVICES: Service[] = [
  {
    id: 'bodas',
    title: 'Bodas',
    script: 'el día entero',
    text: 'Desde que amarran el vestido hasta la última canción. Civil, iglesia, hacienda, viñedo o charra: me muevo sin que se note y llego antes que la luz buena.',
    from: 16900,
    photos: ['chispas-frias', 'charro-frente', 'velo-mirada', 'altar-dorado', 'confeti-risa'],
    tags: ['Preparativos', 'Ceremonia', 'Retratos', 'Fiesta'],
  },
  {
    id: 'xv',
    title: 'XV años',
    script: 'su noche',
    text: 'Sesión previa en exterior, misa, vals, chambelanes y fiesta. Que el vestido se vea como ella lo soñó y que la pista se vea como se sintió.',
    from: 12500,
    photos: ['xv-esmeralda', 'xv-papa', 'xv-falda-rosa', 'xv-amigas', 'xv-iglesia'],
    tags: ['Sesión previa', 'Misa', 'Vals', 'Fiesta'],
  },
  {
    id: 'social',
    title: 'Eventos sociales',
    script: 'lo que se celebra',
    text: 'Bautizos, primeras comuniones, graduaciones y aniversarios. Coberturas más cortas, el mismo cuidado y entrega en dos semanas.',
    from: 6500,
    photos: ['brindis-bengalas', 'comunion-guantes', 'graduacion', 'bautizo', 'brindis-confeti'],
    tags: ['Bautizos', 'Comuniones', 'Graduaciones', 'Aniversarios'],
  },
];

export interface Package {
  id: string;
  group: 'Bodas' | 'XV años' | 'Eventos sociales';
  name: string;
  hours: string;
  photo: string;
  summary: string;
  price: number;
  featured?: boolean;
  includes: string[];
}

export const PACKAGES: Package[] = [
  {
    id: 'alba',
    group: 'Bodas',
    name: 'Alba',
    hours: '6 horas · 1 fotógrafo',
    photo: 'mirada-bn',
    summary: 'Para bodas civiles o íntimas: ceremonia, retratos y la primera parte de la fiesta.',
    price: 16900,
    includes: ['6 horas de cobertura continua', '400 fotos editadas o más', 'Galería privada en línea por un año', '30 fotos de adelanto en 72 horas', 'Entrega completa en 5 semanas'],
  },
  {
    id: 'constelacion',
    group: 'Bodas',
    name: 'Constelación',
    hours: '10 horas · 2 fotógrafos',
    photo: 'chispas-frias',
    summary: 'El más pedido. De los preparativos al vals, con segundo fotógrafo y sesión preboda.',
    price: 27500,
    featured: true,
    includes: ['10 horas de cobertura con dos fotógrafos', 'Sesión preboda (2 horas, un lugar)', '800 fotos editadas o más', 'Álbum de lino 30 × 30 cm, 30 páginas', 'Galería privada en línea por dos años', '50 fotos de adelanto en 72 horas'],
  },
  {
    id: 'firmamento',
    group: 'Bodas',
    name: 'Firmamento',
    hours: 'Todo el día · 2 fotógrafos + dron',
    photo: 'hacienda-sombrero',
    summary: 'Cobertura sin reloj, tomas aéreas, video resumen y el álbum de lujo.',
    price: 39800,
    includes: ['Cobertura sin límite de horas el día de la boda', 'Sesión preboda y sesión de pareja después de la boda', 'Tomas con dron (sujeto a permiso del lugar)', 'Video resumen de 3 minutos', 'Álbum de piel 35 × 35 cm, 40 páginas, con caja', '20 impresiones fine art 20 × 30 cm', 'Rollo analógico de 36 fotos de regalo'],
  },
  {
    id: 'estrella',
    group: 'XV años',
    name: 'Estrella',
    hours: '5 horas · sesión previa',
    photo: 'xv-esmeralda',
    summary: 'Sesión previa en exterior, misa y fiesta hasta el vals y el baile sorpresa.',
    price: 12500,
    includes: ['Sesión previa de 90 minutos', '5 horas de cobertura del evento', '350 fotos editadas o más', 'Galería privada en línea', '25 fotos de adelanto para el álbum de invitados'],
  },
  {
    id: 'gala',
    group: 'XV años',
    name: 'Gala',
    hours: '8 horas · 2 fotógrafos',
    photo: 'xv-falda-rosa',
    summary: 'Todo el día, con segundo fotógrafo para la pista y un álbum para ella.',
    price: 18900,
    includes: ['Sesión previa de 2 horas en dos lugares', '8 horas de cobertura con dos fotógrafos', '600 fotos editadas o más', 'Álbum 25 × 25 cm, 24 páginas', 'Video vertical de 60 segundos para redes'],
  },
  {
    id: 'celebracion',
    group: 'Eventos sociales',
    name: 'Celebración',
    hours: '3 horas · 1 fotógrafo',
    photo: 'comunion-guantes',
    summary: 'Bautizos, comuniones, graduaciones y aniversarios. Ceremonia y convivio.',
    price: 6500,
    includes: ['3 horas de cobertura', '200 fotos editadas o más', 'Retratos de familia organizados', 'Galería privada en línea', 'Entrega en 2 semanas'],
  },
];

export const EXTRAS = [
  { name: 'Segundo fotógrafo', price: 3500, note: 'por evento' },
  { name: 'Hora adicional', price: 1900, note: 'por hora' },
  { name: 'Tomas con dron', price: 2800, note: 'sujeto a permiso del lugar' },
  { name: 'Video resumen de 3 minutos', price: 6000, note: 'con música licenciada' },
  { name: 'Sesión preboda o de pareja', price: 4500, note: '2 horas, un lugar' },
  { name: 'Álbum de lino 30 × 30 cm', price: 5200, note: '30 páginas' },
  { name: 'Rollo analógico (36 fotos)', price: 2200, note: 'revelado e impreso' },
  { name: 'Impresiones fine art', price: 450, note: 'cada una, 20 × 30 cm' },
];

export const PROCESS = [
  { n: '01', title: 'Platicamos', text: 'Una llamada o un café en el estudio. Me cuentas cómo imaginas el día y yo te digo con honestidad si soy la persona indicada.' },
  { n: '02', title: 'Apartas tu fecha', text: 'Con el 30 % de anticipo y un contrato sencillo. La fecha queda bloqueada en el calendario en ese momento.' },
  { n: '03', title: 'Planeamos juntos', text: 'Tres semanas antes armamos el horario, la lista de fotos de familia y los lugares de retrato. Nada se improvisa.' },
  { n: '04', title: 'El día', text: 'Llego una hora antes, conozco a tu coordinadora y desaparezco entre los invitados. Tú solo vives tu día.' },
  { n: '05', title: 'La entrega', text: 'En 72 horas tienes el adelanto. La galería completa llega en 5 semanas, editada foto por foto, nada en automático.' },
];

export const FAQ = [
  { q: '¿Cuánto anticipo necesito para apartar mi fecha?', a: 'El 30 % del paquete. El resto se liquida una semana antes del evento. Puedes pagar con transferencia o tarjeta (con comisión del banco).' },
  { q: '¿Cuántas fotos voy a recibir?', a: 'Depende de la cobertura: en promedio entre 70 y 90 fotos editadas por hora. No te entrego fotos repetidas ni con los ojos cerrados para llegar a un número.' },
  { q: '¿Entregas los archivos RAW?', a: 'No. El RAW es como el negativo sin revelar: la edición es parte de mi trabajo y de cómo se ven tus fotos.' },
  { q: '¿Viajas fuera de Aguascalientes?', a: 'Sí. Dentro de la ciudad no hay costo extra; a Zacatecas, León, Guadalajara o San Miguel de Allende se suman los viáticos. Destino fuera del país, se cotiza aparte.' },
  { q: '¿Qué pasa si llueve o algo cambia el día?', a: 'Siempre llevo un plan B de luz y lugares cubiertos. Si cambia la fecha con más de 90 días de anticipación, el anticipo se respeta para la nueva fecha disponible.' },
  { q: '¿Puedo pedir fotos específicas?', a: 'Claro. Tres semanas antes hacemos una lista de fotos de familia y momentos que no pueden faltar. Lo demás déjamelo a mí.' },
];

export interface Review {
  name: string;
  user: string;
  event: string;
  when: string;
  stars: number;
  text: string;
  likes: number;
  photo: string;
  reply?: string;
}

export const REVIEWS: Review[] = [
  { name: 'Mariana Lozano', user: 'marilozano', event: 'Boda · Viñedo Cielo Rojo', when: 'hace 2 semanas', stars: 5, likes: 48, photo: 'atardecer-campo', text: 'Nos entregó el adelanto antes de regresar de la luna de miel. Lloramos con las fotos de mi abuelita bailando. Emilio no se notaba y aun así estuvo en todo.', reply: 'Gracias, Mari. Esa foto de tu abuelita es de mis favoritas del año.' },
  { name: 'Regina Torres', user: 'regi.torres', event: 'XV años · Salón Cristal', when: 'hace 1 mes', stars: 5, likes: 31, photo: 'xv-esmeralda', text: 'Me daba pena posar y me hizo reír toda la sesión. Mi mamá ya imprimió como veinte fotos para la casa.' },
  { name: 'Andrés y Fer', user: 'andresyfer', event: 'Boda charra · Hacienda Los Arcos', when: 'hace 2 meses', stars: 5, likes: 57, photo: 'hacienda-sombrero', text: 'La boda fue un caos lindo de mariachi, caballos y lluvia. Las fotos se ven como una película. Recomendadísimo.', reply: 'La lluvia nos regaló la mejor luz, ¡qué día!' },
  { name: 'Lucía Esparza', user: 'luciaesparza', event: 'Bautizo · Templo del barrio', when: 'hace 3 meses', stars: 5, likes: 12, photo: 'bautizo', text: 'Cobertura corta pero se notó el detalle: las manos de mi papá cargando al bebé, la vela, todo. Entregó en diez días.' },
  { name: 'Daniela Ruiz', user: 'dani.ruizm', event: 'Boda · Casona Tres Lunas', when: 'hace 4 meses', stars: 5, likes: 26, photo: 'velo-mirada', text: 'Lo mejor fue la planeación: llegó con el horario de luz y la lista de fotos de familia. El día no tuvimos que pensar en nada.' },
  { name: 'Jorge Medina', user: 'jorgemedina', event: 'Graduación · UAA', when: 'hace 5 meses', stars: 4, likes: 9, photo: 'graduacion', text: 'Muy profesional y rápido. Solo me hubiera gustado más fotos de grupo, pero las que hay están increíbles.', reply: 'Gracias, Jorge. Tomo nota para la próxima generación.' },
  { name: 'Valeria Campos', user: 'vale.campos', event: 'Boda · Jardín El Mezquite', when: 'hace 6 meses', stars: 5, likes: 22, photo: 'chispas-frias', text: 'La foto del primer baile entre chispas es la que todos nos piden. Valió cada peso.' },
];

export interface GearItem {
  id: string;
  group: string;
  name: string;
  short: string;
  why: string;
  specs: [string, string][];
  image?: string;
}

export const GEAR: GearItem[] = [
  {
    id: 'x100',
    group: 'La que siempre cuelga',
    name: 'Fujifilm X100VI',
    short: 'Cámara compacta de 40 MP con lente fijo de 23 mm f/2.',
    why: 'Pesa medio kilo y no intimida a nadie. Con ella saco las fotos de mesa, de los niños y de los abuelos, cuando la cámara grande haría que todos posaran.',
    specs: [['Sensor', 'APS-C X-Trans 5 · 40 MP'], ['Lente', '23 mm f/2 (35 mm equivalente)'], ['Estabilizador', '6 pasos en el cuerpo'], ['Para', 'Momentos espontáneos y mesas']],
    image: 'camara-colgante',
  },
  {
    id: 'xh2s',
    group: 'Cuerpos principales',
    name: '2 × Fujifilm X-H2S',
    short: 'Sensor apilado de 26 MP, enfoque rápido y doble ranura de tarjeta.',
    why: 'Siempre traigo dos cuerpos: uno con lente angular y otro con tele. Si uno falla, el otro sigue. Cada foto se graba en dos tarjetas al mismo tiempo.',
    specs: [['Sensor', 'APS-C apilado · 26 MP'], ['Ráfaga', 'Hasta 40 fotos por segundo'], ['ISO útil', 'Hasta 12 800 sin ruido visible'], ['Respaldo', 'Doble tarjeta, grabación espejo']],
  },
  {
    id: 'gfx',
    group: 'Retrato',
    name: 'Fujifilm GFX100 II',
    short: 'Formato medio de 102 MP para retratos y sesiones.',
    why: 'Para la preboda y los retratos de pareja. El formato medio separa a las personas del fondo con una suavidad que no logra otra cámara.',
    specs: [['Sensor', 'Formato medio · 102 MP'], ['Rango dinámico', 'Más de 14 pasos'], ['Lente favorito', 'GF 80 mm f/1.7'], ['Para', 'Prebodas, retratos y XV']],
  },
  {
    id: 'lentes',
    group: 'Lentes',
    name: 'Cinco lentes, cada uno con su momento',
    short: '16–55 mm f/2.8 · 33 mm f/1.4 · 56 mm f/1.2 · 50–140 mm f/2.8 · 80 mm macro.',
    why: 'El 56 mm es para los retratos, el 50–140 para la ceremonia sin acercarme al altar y el macro para los anillos y el encaje.',
    specs: [['Angular', 'XF 16–55 mm f/2.8 R LM WR II'], ['Retrato', 'XF 56 mm f/1.2 R WR'], ['Ceremonia', 'XF 50–140 mm f/2.8 R LM OIS WR'], ['Detalles', 'XF 80 mm f/2.8 Macro']],
    image: 'lente',
  },
  {
    id: 'dron',
    group: 'Desde el aire',
    name: 'DJI Mavic 3 Pro',
    short: 'Tres cámaras, 43 minutos de vuelo y sensor 4/3.',
    why: 'Para la hacienda completa, la salida de la iglesia y la fila de bengalas vista desde arriba. Vuelo solo con permiso del lugar y lejos de los invitados.',
    specs: [['Cámara principal', 'Hasselblad 4/3 · 20 MP'], ['Vuelo', 'Hasta 43 minutos'], ['Video', '5.1K a 50 cuadros'], ['Piloto', 'Registro ante la AFAC']],
    image: 'dron',
  },
  {
    id: 'luz',
    group: 'Luz',
    name: 'Flashes Godox V1 y AD200 Pro',
    short: 'Luz suave rebotada para salones oscuros y la pista.',
    why: 'Uso el flash rebotado en techo y paredes para que la fiesta se vea como se veía, no como un interrogatorio.',
    specs: [['En cámara', '2 × Godox V1 (cabeza redonda)'], ['Portátil', 'AD200 Pro con softbox'], ['Disparo', 'Inalámbrico, hasta 100 m'], ['Para', 'Pista, vals y retratos de noche']],
  },
  {
    id: 'respaldo',
    group: 'Respaldo',
    name: 'Tus fotos viven en tres lugares',
    short: 'Doble tarjeta, disco en el estudio y copia en la nube.',
    why: 'Nunca formateo una tarjeta hasta que la boda está entregada. Tu boda no depende de un solo disco duro.',
    specs: [['En el evento', 'Doble tarjeta por cámara'], ['En el estudio', 'Arreglo de discos espejo'], ['Fuera', 'Copia cifrada en la nube'], ['Edición', 'Pantalla calibrada EIZO']],
  },
];
