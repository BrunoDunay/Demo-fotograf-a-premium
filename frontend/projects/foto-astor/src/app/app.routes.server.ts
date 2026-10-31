import { RenderMode, ServerRoute } from '@angular/ssr';

// Todas las páginas se prerenderizan (salida estática). Las rutas desconocidas caen a index.csr.html (vercel.json).
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
