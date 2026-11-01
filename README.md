# Astor · Demo Premium de fotografía

Sitio demo con marca ficticia para el portafolio de Bruno Dunay: Emilio Astor, fotógrafo de bodas, XV años y eventos sociales en Aguascalientes (paquete **Premium**).

La marca, las personas, las reseñas, los datos de contacto y los precios son inventados. Las fotos y los videos son de Pexels (licencia libre).

Lo más destacado:

- **Mesa de fotos** en la portada (copias de cuarto oscuro): arrastrar, lanzar, ver de cerca en 3D y soltar más fotos al azar.
- **Galería en 3D** (Three.js) que se recorre con el scroll como cambios de escena: cinco salas con pantallas LED, transiciones suaves, siluetas mirando, logo en muros y piso, y piso pulido que refleja. Al final, un archivo en mosaico con filtros.
- **Rollo de película** con videos, en blanco y negro o a color.
- **Réflex en 3D colgando de su correa** (con física; se mece al rozarla) y **tarjeta de presentación en 3D** en cuatro colores, calendario de pared, "save the date", reseñas tipo Instagram y formulario que abre WhatsApp.

La ficha de diseño completa (concepto, paleta, tipografías, secciones e interacciones) está en `docs/astor.md`.

## Código

Workspace de Angular 22 en `frontend/` con la app `projects/foto-astor`. Salida estática prerenderizada, componentes standalone con signals y sin zone.js, GSAP + Lenis para el movimiento y Three.js en la galería, la cámara y la tarjeta (se carga al entrar).

```bash
cd frontend
npm install
npm start          # servidor local en http://localhost:4310
npm run build      # compila en dist/foto-astor/browser
npm run media      # vuelve a generar fotos, videos y recortes (opcional)
```

En Windows/OneDrive, si el servidor se reinicia solo, detenerlo y volver a correr `npm start`.

## Despliegue

Pensado para Vercel conectado a este repositorio: directorio raíz `frontend/`, instalación `npm ci`, compilación `npx ng build foto-astor`, salida `dist/foto-astor/browser`, Node 24. Las cabeceras de seguridad y el respaldo a `index.csr.html` están en `frontend/vercel.json`.
