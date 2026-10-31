import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_URL = 'https://demo-foto-astor.vercel.app';

interface SeoData {
  title: string;
  description: string;
}

/** Título, descripción, canónica y Open Graph por página, a partir de data.seo de cada ruta. */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  start() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      const seo = r.snapshot.data['seo'] as SeoData | undefined;
      if (!seo) return;
      const path = this.router.url.split(/[?#]/)[0];
      const url = SITE_URL + (path === '/' ? '/' : path);
      this.title.setTitle(seo.title);
      this.meta.updateTag({ name: 'description', content: seo.description });
      this.meta.updateTag({ property: 'og:title', content: seo.title });
      this.meta.updateTag({ property: 'og:description', content: seo.description });
      this.meta.updateTag({ property: 'og:url', content: url });
      let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = this.doc.createElement('link');
        link.rel = 'canonical';
        this.doc.head.appendChild(link);
      }
      link.href = url;
    });
  }
}
