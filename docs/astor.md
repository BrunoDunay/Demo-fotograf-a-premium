# Astor · Fotografía de bodas y eventos sociales (paquete Premium)

**Código:** `frontend/projects/foto-astor` · **Local:** `npm start` en `frontend/` → http://localhost:4310

## Concepto

Emilio Astor (fotógrafo ficticio, Aguascalientes, desde 2017): bodas, XV años y eventos sociales (bautizos, comuniones, graduaciones, aniversarios). Lema: **"Noches que brillan una sola vez"**.

La idea del sitio: **las fotos se tocan**. En la portada se revuelven como en una mesa, en la galería se recorren como una exposición y la tarjeta de presentación se gira en la mano.

## Identidad

- **Logo:** ASTOR con una estrella de cuatro puntas sobre la A y una órbita con su luna (de la referencia "Elementos gráficos"). La órbita tiene profundidad: la mitad de atrás pasa detrás de la palabra; al aparecer se dibuja y las letras suben, al pasar el cursor la luna da la vuelta y la estrella destella (`shared/logo.ts`). Estrellas, órbitas y lunas en línea fina decoran todo el sitio (`shared/celestial.ts`).
- **Paleta** (fría, para no parecerse a Armando Ovalle Wedding Studio, que es marfil/espresso/moca): porcelana `#e9ebef`, azul medianoche `#141b2d`, noche `#070b16` (galería, rollo, pie, legales) y un solo acento, palo de rosa `#a4514f` / `#e2a7a0`. Todo en variables en `styles.css`.
- **Tipografías:** Instrument Serif (títulos y su itálica para los acentos), Instrument Sans (etiquetas en versales), Hanken Grotesk (texto) y Mrs Saint Delafield solo para lo escrito a mano (pies de foto, firma).
- **Botones:** el texto rueda al pasar el cursor (`.btn-t` en cada plantilla), el relleno nace donde entra el cursor y se retira por donde sale, y el botón se deja jalar un poco (magnético, en `core/motion.ts`). `.btn-accent` es la acción principal (Aparta tu fecha) con un brillo que pasa cada tanto.
- **Menú:** pastilla que se desliza con resorte al enlace bajo el cursor, letras que ruedan una por una y una estrella en el enlace activo.
- **Cambio de página:** View Transitions (la página se hunde en la noche y la nueva sube como cortina; el encabezado se queda).
- **Materiales:** papel con grano, clips de oficina negros, cinta, notas adhesivas, instantáneas con su pie escrito a mano.

## Intro (~3 s, una vez por sesión)

Cielo de estrellas que se acerca; nace la estrella con un destello de lente; un cometa dibuja la órbita y se queda como la luna; ASTOR se enfoca mientras sus letras se juntan. Cierra un **diafragma de cámara de 7 hojas** y se abre ya sobre la mesa de fotos. Se salta con un clic.

## Páginas y secciones

### Inicio
1. **Mesa de fotos** (referencia "Zona interactiva para la galería en el home", `sections/photo-pile.*`). Instantáneas encimadas al azar con su pie a mano (pareja o quinceañera, lugar y año).
   - Arrastrar (mantener o mover) levanta la foto: la sombra se hace difusa y crece, se inclina según la velocidad.
   - **Soltar con fuerza la lanza fuera de la mesa** (con giro). Suave: se desliza y frena.
   - **Toque corto: la foto "viene hacia ti"** en 3D (se levanta, se endereza, crece y se inclina como cuando acercas una foto a la cara), con la versión en alta. Se regresa a la mesa con la misma animación al revés (más rápida), con Esc, la X o deslizando hacia abajo.
   - Al quedar 3 o menos aparece **"Soltar más fotos"**: caen nuevas **al azar** del archivo (99 fotos), sin repetir hasta verlas todas. **Límite: 14 en escritorio y 9 en celular.** Caen como un bonche que alguien suelta: juntas y casi alineadas; al tocar la mesa se abren en abanico y resbalan.
2. **Lugares y planners** con los que trabaja (referencia "Marcas"): franja que nunca se detiene; siete tienen logotipo propio (arcos, uvas, lunas, flor, sello circular, monograma, vela) y los demás van solo con su tipografía.
3. **Lo que fotografía:** Bodas, XV años y Eventos sociales; al pasar por cada renglón sus fotos se abren en abanico.
4. **Invitación a la galería:** sala en miniatura en CSS 3D con pantallas que cambian con barrido.
5. **Rollo de la temporada** (referencia del video del carrete): columnas de película inclinadas con **videos** en cada cuadro, un solo canvas, despacio (26–44 px/s). Interruptor **Blanco y negro / Color**: el blanco y negro lo aplica la tarjeta gráfica a todo el canvas (no cuadro por cuadro) y el cuadro iluminado va en una segunda capa a color. Se decodifican 10 videos (6 en celular).
6. **Reseñas estilo Instagram** (referencia "Dejar reseñas"): caja para escribir (sello redondo, cinta, estrellas) y comentarios con "me gusta" y respuestas verificadas de @astor.foto. Sin backend: lo que publicas aparece arriba "En revisión" solo en tu navegador.
7. **¿Ya tienen fecha?:** eliges qué celebras, escribes los nombres y tocas tu día en un calendario (sin fechas ocupadas); al lado se arma una tarjeta "Save the date" con la cuenta regresiva. "Apartar esta fecha" lleva fecha y tipo de evento al formulario.

### Galería (`/galeria`, `pages/gallery/`)
Exposición en **Three.js** que se recorre con el scroll como **cambios de escena dentro de la misma galería**: 12 encuadres compuestos; dentro de una sala la cámara se desliza de uno a otro y entre salas hay un fundido breve a negro (también al rodear la caja). El avance sigue al scroll con un resorte amortiguado (sin atorarse ni brincar). Piso de concreto pulido con reflejo limpio (Fresnel, sin distorsión), muros de yeso oscuro con luz que los baña desde arriba, techo en penumbra, MSAA y sin grano.

| Sala | Instalación | Qué muestra |
|---|---|---|
| I Bienvenida | Muro LED de 10 × 4.2 m | Logo, panel de texto + foto, cifras, retícula de cuatro tiempos, fotos a pantalla completa |
| II Tótems | 5 pantallas verticales de pie | Bodas y XV años; a veces la foto enmarcada con ficha (N.º, título) o el logo |
| III La caja | Cubo LED girado 45° | Boda charra y XV años; **el contenido da la vuelta a la esquina** entre dos caras |
| IV Detalles | Tríptico en la pared + 5 pantallas cuadradas en el piso | Una historia en tres tiempos y detalles (anillos, velo, zapatillas) |
| V Panorama | Pantalla curva de 110° con banca redonda | Tiras de XV y celebraciones, una reseña, el logo, panorámicas y la invitación final |

- **Logo** en las pantallas de varias salas, rotulado en vinil en los muros (logo a la entrada y nombre de cada sala) y proyectado en el piso (gobo que gira despacio).
- **Transiciones** en shader (`screen.ts`), suaves y sin pixeles: barrido difuso, deslizamiento con paralaje, vidrio estriado, iris suave, acercamiento con desenfoque, apertura al centro, cortina y fundido por luminosidad. Ken Burns en las fotos fijas.
- Cada pantalla **ilumina el cuarto y el piso con el color de lo que muestra**.
- **Siluetas** (12): personas reales recortadas y rellenas de negro, siempre de frente a la cámara.
- **Tocar una pantalla abre en el visor la foto que está mostrando en ese momento.**
- Riel de salas a la derecha para saltar entre ellas. En celular la cámara se aleja un poco. Sin WebGL 2: retícula de fotos.

### Sobre mí (`/sobre-mi`, referencias "Sobre mí")
Retrato partido en 20 mosaicos que llegan desordenados y se acomodan (se mueven con el cursor a distintas profundidades), notas adhesivas "Busco / lo que / nadie / está mirando", la historia en hojas con clips (una oscura), una instantánea, cifras y un collage. Las notas, la instantánea y las fotos del collage **se despegan y se pegan en otro lado** (directiva `shared/stick.ts`), así nada tapa el texto. Firma "Emilio" al final.

### Mi equipo (`/equipo`)
**Cámara telemétrica en 3D** (Three.js, `sections/hanging-camera.ts`) colgando de su correa: modelo hecho con piezas (cuerpo forrado, metal cepillado, lente con anillos estriados y cristal con tratamiento, diales, argollas) y **física Verlet**: dos tiras de correa del gancho a cada argolla y la cámara como cuerpo rígido de 4 partículas. Se agarra, se jala y se suelta; si el cursor la roza, la empuja. Proyecta su sombra en la pared. Abajo, ficha técnica desplegable, **la pantalla del dron** (toma aérea con la interfaz de vuelo: REC, altura, distancia, gimbal; el cursor mueve la cámara) y "Tus fotos viven en tres lugares".

### Paquetes (`/paquetes`, referencia "Paquetes")
Boletos con foto, cobertura, nombre, precio grande tras una línea punteada y "Qué incluye" desplegable. El más pedido va en versión de noche, más grande, con halo que gira, sello circular "El más pedido · El que más conviene", listón "Recomendado" y botón de acento: Bodas (Alba $16,900 · Constelación $27,500 · Firmamento $39,800), XV años (Estrella $12,500 · Gala $18,900) y Eventos sociales (Celebración $6,500). "Me interesa" lleva el paquete al formulario. Extras en hoja con clip, proceso en 5 pasos y preguntas frecuentes.

### Contacto (`/contacto`)
- **Tarjeta de presentación en 3D** (Three.js): cartulina estándar 3.5 × 2 in con esquinas en punta, letras hundidas (letterpress con relieve), foil metálico que refleja la luz según el ángulo y canto pintado. **Cuatro colores**: Porcelana, Medianoche, Palo de rosa y Carbón. Se gira libre arrastrándola, con inercia; se voltea con el botón o doble toque.
- Guardar contacto (vCard sin teléfono) y copiar correo.
- **Calendario de pared con argollas** y hojas apiladas; al cambiar de mes la hoja se voltea sobre las argollas. Sin fechas ocupadas: solo un punto en los días de alta demanda (ficticio).
- **Formulario** en hoja con profundidad: tipo de evento con botones, invitados con control segmentado, campos con etiqueta flotante y línea que se dibuja. La vista previa va en un celular con "escribiendo…" y abre WhatsApp.

### Legales (referencia "apartado legal")
`/aviso-de-privacidad`, `/terminos-y-condiciones`, `/cookies`: fondo oscuro con foto en blanco y negro, título en itálica, subtítulo manuscrito y secciones en línea de tiempo. Aviso de cookies con "Solo necesarias".

## Fotos y videos

- **99 fotos de eventos + 4 de "Emilio"** de Pexels (licencia libre), elegidas por impacto y variedad (bodas charras y en hacienda, iglesia, bengalas, pista, XV de colores, bautizos, comuniones, graduaciones). `scripts/media.mjs` las baja, saca WebP normal (1600 px) y `-sm` (720 px) y su color promedio. Lista y textos en ese script; genera `src/app/core/media.data.ts`.
- **17 videos** de Pexels: MP4 de 400 × 300 para el rollo (≈3 MB en total) y de 960 px para el visor, con póster. Más la toma aérea `aereo-jardin` (Pexels 29779627) para la pantalla del dron, generada con `scripts/aerial.mjs`.
- **Recortes** (`scripts/recortes/`): cámara Fujifilm X100V colgando, lente, dron y 12 personas para las siluetas, sin fondo con `@imgly/background-removal-node`.
- `scripts/brand-assets.mjs`: favicon.ico, apple-touch-icon y la imagen para compartir `og.jpg`.

## Pendiente

- Video demo en motion graphics (referencias en `referencias/ideas para video demo/`), cuando el sitio esté aprobado.
- Si se vende con panel: reseñas y calendario reales (backend), moderación de reseñas y agenda.
