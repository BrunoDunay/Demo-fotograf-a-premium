import { Routes } from '@angular/router';
import Home from './pages/home';
import { pageCurtainGuard } from './shared/page-curtain';

// data.seo: título y descripción de cada página (core/seo.ts). data.theme: 'night' pinta el encabezado claro.
const pages: Routes = [
  {
    path: '',
    component: Home,
    data: {
      seo: {
        title: 'Astor · Fotografía de bodas y eventos sociales en Aguascalientes',
        description:
          'Emilio Astor fotografía bodas, XV años y eventos sociales en Aguascalientes. Juega con la mesa de fotos, recorre la galería y revisa fechas disponibles.',
      },
    },
  },
  {
    path: 'galeria',
    loadComponent: () => import('./pages/gallery/gallery'),
    data: {
      theme: 'night',
      seo: {
        title: 'Galería · Astor Fotografía',
        description:
          'Recorre la galería de Astor como una exposición: pantallas con bodas, XV años y eventos sociales en Aguascalientes. Toca una pantalla para ver la foto.',
      },
    },
  },
  {
    path: 'sobre-mi',
    loadComponent: () => import('./pages/about'),
    data: {
      seo: {
        title: 'Sobre mí · Emilio Astor, fotógrafo en Aguascalientes',
        description:
          'Quién es Emilio Astor, cómo llegó a la fotografía de bodas y cómo trabaja el día de tu evento.',
      },
    },
  },
  {
    path: 'equipo',
    loadComponent: () => import('./pages/gear'),
    data: {
      seo: {
        title: 'Mi equipo · Astor Fotografía',
        description:
          'Cámaras, lentes, dron, luces y respaldo que usa Emilio Astor en cada boda y evento, explicados sin rodeos.',
      },
    },
  },
  {
    path: 'paquetes',
    loadComponent: () => import('./pages/packages'),
    data: {
      seo: {
        title: 'Paquetes y precios · Astor Fotografía',
        description:
          'Paquetes de fotografía para bodas, XV años y eventos sociales en Aguascalientes, con extras, proceso de trabajo y preguntas frecuentes.',
      },
    },
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contact'),
    data: {
      seo: {
        title: 'Contacto y fechas disponibles · Astor Fotografía',
        description:
          'Revisa las fechas disponibles, guarda la tarjeta de Emilio Astor y arma tu mensaje para WhatsApp en un minuto.',
      },
    },
  },
  {
    path: 'aviso-de-privacidad',
    loadComponent: () => import('./pages/legal'),
    data: { doc: 'privacidad', theme: 'night', seo: { title: 'Aviso de privacidad · Astor Fotografía', description: 'Cómo cuida Astor Fotografía tus datos personales.' } },
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () => import('./pages/legal'),
    data: { doc: 'terminos', theme: 'night', seo: { title: 'Términos y condiciones · Astor Fotografía', description: 'Condiciones de contratación, entregas y uso de imágenes de Astor Fotografía.' } },
  },
  {
    path: 'cookies',
    loadComponent: () => import('./pages/legal'),
    data: { doc: 'cookies', theme: 'night', seo: { title: 'Política de cookies · Astor Fotografía', description: 'Qué cookies usa este sitio y cómo elegirlas.' } },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found'),
    data: { seo: { title: 'Página no encontrada · Astor Fotografía', description: 'Esta página no existe.' } },
  },
];

/** Todas las páginas esperan a que el obturador tape la pantalla antes de cambiar (shared/page-curtain.ts). */
export const routes: Routes = pages.map((r) => ({ ...r, canActivate: [pageCurtainGuard] }));
