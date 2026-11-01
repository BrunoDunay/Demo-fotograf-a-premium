import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // El desplazamiento a fragmentos lo hace core/motion.ts con scroll suave.
    // Cambio de página con View Transitions: la página anterior se hunde en la noche y la nueva sube como cortina
    // (estilos en styles.css). Con "Reducir movimiento" o al cambiar solo de fragmento se salta.
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideClientHydration(withEventReplay()),
  ],
};
