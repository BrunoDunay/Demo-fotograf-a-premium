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
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideClientHydration(withEventReplay()),
  ],
};
