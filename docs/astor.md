# Astor · Fotografía de bodas y eventos sociales (paquete Premium)

**Código:** `frontend/projects/foto-astor` · **Local:** `npm start` en `frontend/` → http://localhost:4310

## Concepto

Emilio Astor (fotógrafo ficticio, Aguascalientes, desde 2017): bodas, XV años y eventos sociales (bautizos, comuniones, graduaciones, aniversarios). Lema: **"Noches que brillan una sola vez"**.

La idea del sitio: **las fotos se tocan**. En la portada se revuelven como en una mesa, en la galería se recorren como una exposición y la tarjeta de presentación se gira en la mano.

## Identidad

- **Logo:** ASTOR en Bodoni con una estrella de cuatro puntas sobre la A y una órbita fina con su luna (de la referencia "Elementos gráficos"). Las estrellas, órbitas y lunas en línea fina son el decorado de todo el sitio (`shared/celestial.ts`).
- **Paleta:** papel de algodón `#efece6`, tinta `#171614`, noche `#0a0a0b` (galería, rollo, pie, legales) y un solo acento cálido, champán `#a98b66` / `#cdb592`. Todo en variables en `styles.css`.
- **Tipografías** (referencia "Tipografías", fuentes de lujo): Bodoni Moda (títulos, alto contraste), Mrs Saint Delafield (manuscrita, firmas y acentos), Oswald (etiquetas en versalitas condensadas, como la referencia de "Sobre mí") y Hanken Grotesk (texto).
- **Materiales:** papel con grano, clips de oficina negros, cinta, notas adhesivas, instantáneas con su pie escrito a mano.

## Intro (~2 s, una vez por sesión)

En negro se enciende la estrella, se dibuja la órbita, sube la palabra ASTOR y dispara un **flash de cámara**. Al apagarse el flash ya estás en la mesa de fotos y las fotos caen. Se salta con un clic.

## Páginas y secciones

### Inicio
1. **Mesa de fotos** (referencia "Zona interactiva para la galería en el home", `sections/photo-pile.*`). Instantáneas encimadas al azar con su pie a mano (pareja o quinceañera, lugar y año).
   - Arrastrar (mantener o mover) levanta la foto: la sombra se hace difusa y crece, se inclina según la velocidad.
   - **Soltar con fuerza la lanza fuera de la mesa** (con giro). Suave: se desliza y frena.
   - **Toque corto: la foto "viene hacia ti"** en 3D (se levanta, se endereza, crece y se inclina como cuando acercas una foto a la cara), con la versión en alta. Se regresa a la mesa con la misma animación al revés (más rápida), con Esc, la X o deslizando hacia abajo.
   - Al quedar 3 o menos aparece **"Soltar más fotos"**: caen nuevas **al azar** del archivo (99 fotos), sin repetir hasta verlas todas. **Límite: 14 en escritorio y 9 en celular.**
2. **Lugares y planners** con los que trabaja (referencia "Marcas"): franja que corre sola, cada nombre con otra tipografía de lujo.
3. **Lo que fotografía:** Bodas, XV años y Eventos sociales; al pasar por cada renglón sus fotos se abren en abanico.
4. **Invitación a la galería:** sala en miniatura en CSS 3D con pantallas que cambian con barrido.
5. **Rollo de la temporada** (referencia del video del carrete): columnas de película inclinadas con **videos** en cada cuadro, un solo canvas. Interruptor **Blanco y negro / Color**; con el cursor encima el cuadro se ilumina y toma color; al tocarlo se abre el video. El scroll acelera las columnas.
6. **Reseñas estilo Instagram** (referencia "Dejar reseñas"): caja para escribir (sello redondo, cinta, estrellas) y comentarios con "me gusta" y respuestas verificadas de @astor.foto. Sin backend: lo que publicas aparece arriba "En revisión" solo en tu navegador.
7. **¿Tu sábado sigue libre?:** los próximos 8 sábados como boletos con su estado; uno libre te lleva al formulario con la fecha puesta.

### Galería (`/galeria`, `pages/gallery/`)
Exposición en **Three.js** que se recorre con el scroll (la cámara camina por una curva y se detiene en cada estación). Piso de concreto pulido con reflejo borroso, luces lineales en el techo, lámparas colgantes, niebla, bloom suave, viñeta y grano.

| Sala | Instalación | Qué muestra |
|---|---|---|
| I Bienvenida | Muro LED de 10 × 4.2 m | Logo, panel de texto + foto, cifras, retícula de cuatro tiempos, fotos a pantalla completa |
| II Tótems | 5 pantallas verticales de pie | Bodas y XV años; a veces la foto enmarcada con ficha (N.º, título) |
| III La caja | Cubo LED girado 45° | Boda charra y XV años; **el contenido da la vuelta a la esquina** entre dos caras |
| IV Detalles | Tríptico en la pared + 5 pantallas cuadradas en el piso | Una historia en tres tiempos (antes, ceremonia, fiesta) y detalles (anillos, velo, zapatillas) |
| V Panorama | Pantalla curva de 110° con banca redonda | Tiras de XV y celebraciones, una reseña, panorámicas y la invitación final |

- **Transiciones** en shader (`screen.ts`), como en el video de referencia: barrido con línea de luz, empuje, costillas de vidrio, iris, pixeles LED, apertura al centro, persianas y fundido. Las fotos fijas tienen un acercamiento lento (Ken Burns). La rejilla de pixeles LED solo se nota de cerca.
- Cada pantalla **ilumina el cuarto y el piso con el color de lo que muestra**.
- **Siluetas** (12): personas reales recortadas y rellenas de negro, de pie en el piso y siempre de frente a la cámara, a contraluz de las pantallas. No son animadas ni detalladas.
- **Tocar una pantalla abre en el visor la foto que está mostrando en ese momento** (y se puede pasar a las demás de esa pantalla). Al pasar el cursor aparece "Ver foto".
- Riel de salas a la derecha para saltar entre ellas. En celular la cámara se aleja un poco para que quepan las pantallas.
- Si el dispositivo no tiene WebGL 2, se muestra una retícula de fotos.

### Sobre mí (`/sobre-mi`, referencias "Sobre mí")
Retrato partido en 20 mosaicos que llegan desordenados y se acomodan (se mueven con el cursor a distintas profundidades), notas adhesivas "Busco / lo que / nadie / está mirando", la historia en hojas con clips (una oscura), una instantánea, cifras y un collage. Firma "Emilio" al final.

### Mi equipo (`/equipo`)
La **cámara cuelga de su correa** de un riel: es un péndulo amortiguado. Si el cursor o el dedo la rozan, la empujan con la velocidad que traen y se balancea hasta detenerse (sin brusquedad). Abajo, ficha técnica desplegable (cámaras, lentes, dron, flashes, respaldo), el **dron que se aparta del cursor** y "Tus fotos viven en tres lugares".

### Paquetes (`/paquetes`, referencia "Paquetes")
Boletos con foto, cobertura, nombre, precio grande tras una línea punteada y "Qué incluye" desplegable: Bodas (Alba $16,900 · Constelación $27,500 · Firmamento $39,800), XV años (Estrella $12,500 · Gala $18,900) y Eventos sociales (Celebración $6,500). "Me interesa" lleva el paquete al formulario. Extras en hoja con clip, proceso en 5 pasos y preguntas frecuentes.

### Contacto (`/contacto`)
- **Tarjeta de presentación en 3D** (no membresía): algodón de 600 g con letterpress, golpe en seco, foil plata que destella según el ángulo y cantos pintados de negro (8 capas). Se **gira libre arrastrándola**, con inercia; se voltea con el botón o doble toque; quieta se acomoda en la cara más cercana. Reverso con datos y trazo de tinta.
- Guardar contacto (vCard sin teléfono) y copiar correo.
- **Calendario de disponibilidad** (referencia): hoja con clip y orilla rasgada, 12 meses, disponible / última plaza / apartada. Datos ficticios pero creíbles (sábados de temporada alta casi llenos).
- **Formulario que abre WhatsApp** con vista previa del chat que se escribe en vivo (fecha, paquete y tipo de evento llegan de otras páginas).

### Legales (referencia "apartado legal")
`/aviso-de-privacidad`, `/terminos-y-condiciones`, `/cookies`: fondo oscuro con foto en blanco y negro, título en itálica, subtítulo manuscrito y secciones en línea de tiempo. Aviso de cookies con "Solo necesarias".

## Fotos y videos

- **99 fotos de eventos + 4 de "Emilio"** de Pexels (licencia libre), elegidas por impacto y variedad (bodas charras y en hacienda, iglesia, bengalas, pista, XV de colores, bautizos, comuniones, graduaciones). `scripts/media.mjs` las baja, saca WebP normal (1600 px) y `-sm` (720 px) y su color promedio. Lista y textos en ese script; genera `src/app/core/media.data.ts`.
- **17 videos** de Pexels: MP4 de 400 × 300 para el rollo (≈3 MB en total) y de 960 px para el visor, con póster.
- **Recortes** (`scripts/recortes/`): cámara Fujifilm X100V colgando, lente, dron y 12 personas para las siluetas, sin fondo con `@imgly/background-removal-node`.
- `scripts/brand-assets.mjs`: favicon.ico, apple-touch-icon y la imagen para compartir `og.jpg`.

## Pendiente

- Video demo en motion graphics (referencias en `referencias/ideas para video demo/`), cuando el sitio esté aprobado.
- Si se vende con panel: reseñas y calendario reales (backend), moderación de reseñas y agenda.
