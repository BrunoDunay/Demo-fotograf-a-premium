# Astor · Demo Premium de fotografía (bodas y eventos sociales)

Leer primero `docs/astor.md` (ficha completa). Repositorio: https://github.com/BrunoDunay/Demo-fotograf-a-premium

## Estructura

- `frontend/`: workspace de Angular 22 con una sola app, `projects/foto-astor` (puerto 4310).
  - `src/app/core/`: `content.ts` (textos, paquetes, reseñas, equipo), `media.ts` + `media.data.ts` (generado), `motion.ts` (GSAP, Lenis, bloqueo de scroll), `booking.ts` (fecha y paquete elegidos, disponibilidad ficticia), `seo.ts`.
  - `src/app/sections/`: mesa de fotos (`photo-pile.*`), rollo de video (`film-reel.ts`), reseñas, tarjeta 3D (`business-card.ts`, Three.js), cámara colgante (`hanging-camera.ts`, Three.js + Verlet), calendario (`availability.ts`), formulario de WhatsApp, "save the date" (`dates-teaser.ts`), etc.
  - `src/app/pages/gallery/`: galería en Three.js. `engine.ts` (sala, recorrido, luces, siluetas, piso reflejante, postproceso), `screen.ts` (pantalla con shader de transiciones), `slides.ts` (dibujo de cada diapositiva en canvas 2D), `programs.ts` (qué pasa cada pantalla y con qué transición).
  - `scripts/media.mjs`: fotos y videos de Pexels → WebP / MP4 y `media.data.ts`. `scripts/brand-assets.mjs`: favicon, ícono de Apple y `og.jpg`. `scripts/recortes/`: PNG sin fondo (cámara, lente, dron, siluetas).
- `referencias/`: material de Bruno (solo local, no se sube).
- `docs/astor.md`: ficha del proyecto.

## Convenciones y aprendizajes

- Movimiento siempre activo; el interruptor "Reducir movimiento" del pie lo apaga (clase `.reduce-motion`).
- `main` **no** lleva `z-index`: los visores (mesa de fotos, rollo, galería) usan `z-index` alto y deben quedar sobre el encabezado.
- `html { overflow-x: clip }`: nada se desplaza de lado (tarjetas giradas y decorados se asoman).
- La mesa de fotos ignora el clic fantasma tras un toque (500 ms) para no cerrar la foto recién abierta.
- El calendario y los boletos de sábados dependen de la fecha de hoy: el calendario se dibuja solo en el navegador.
- Galería: el reflejo del piso es un `Reflector` con shader propio sumado (aditivo) sobre el piso; las pantallas usan `toneMapped: false`. Para cambiar el recorrido, editar `STOPS` en `engine.ts` (`pk` limita cuánto se aleja la cámara en vertical; `cut` fuerza un fundido) y ajustar `STOPS`/`ROOM_STOP` en `gallery.ts`. Nada de transiciones pixeladas ni grano: a Bruno no le gustan.
- Galería, luz: los muros llevan `emissiveMap` (abanicos y baño rasante); las líneas de luz, órbitas y estrellas son materiales básicos con color > 1 para que los tome el bloom. Los umbrales (`PORTALS` en `engine.ts`) no deben tapar rótulos ni encuadres: revisar `STOPS` si se mueven.
- Cámara de Mi equipo: todo el modelo sale de código (sin archivos). Las capas del cristal son materiales metálicos aditivos (`coat`): solo suman reflejo. `LUG_Z` (argollas) decide cuánto cuelga de nariz y `REST_YAW` el giro de reposo.
- El texto de los botones va en `<span class="btn-t">` en la plantilla (no envolverlo con JS: rompe la hidratación).
- Paleta fría a propósito (porcelana, medianoche, palo de rosa) para no parecerse a Armando Ovalle Wedding Studio.
- Capturas de revisión: puppeteer-core con el Chrome instalado; para la galería en modo sin pantalla agregar `--enable-unsafe-swiftshader`.

## Estado (actualizado 4 nov 2026)

- Sitio completo en local: inicio, galería 3D, sobre mí, mi equipo, paquetes, contacto, legales y 404. Compila sin errores ni advertencias.
- Publicada el 1 nov 2026 en https://demo-foto-astor.vercel.app (Vercel `demo-foto-astor`, raíz `frontend`, se publica sola con push a `main`) y agregada al portafolio.
- Carpeta: `Trabajos/2-Demos/Fotografia/Astor-Premium` (junto a Nido, la demo Pro de fotografía, en `../Nido-Pro`).
- `referencias/` queda fuera del repo a propósito.
- Pendiente: video demo y, si se vende, backend para reseñas y calendario.
