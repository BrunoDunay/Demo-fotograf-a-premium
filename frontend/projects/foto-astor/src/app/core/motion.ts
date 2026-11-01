import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { filter } from 'rxjs';

let registered = false;

/** Registra los plugins de GSAP una sola vez (solo en el navegador). */
export function useGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    registered = true;
  }
  return { gsap, ScrollTrigger, SplitText };
}

// Las demos muestran el movimiento siempre (es lo que se presume); quien lo necesite lo apaga con el botón
// "Reducir movimiento" del pie de página, que agrega la clase .reduce-motion a <html>.
export const prefersReducedMotion = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion');
export const hasFinePointer = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isNarrow = () => typeof innerWidth !== 'undefined' && innerWidth < 760;

/** Scroll suave (Lenis) sincronizado con ScrollTrigger, y estado de la intro del logo. */
@Injectable({ providedIn: 'root' })
export class Motion {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  /** true cuando terminó la intro (o no hubo): la mesa de fotos espera esto para soltar las fotos. */
  readonly introDone = signal(false);
  /** Velocidad del scroll (px por cuadro, con signo): el rollo de película la usa para acelerar. */
  velocity = 0;
  private lenis?: Lenis;
  private locks = 0;

  start() {
    if (!this.isBrowser || this.lenis) return;
    const { gsap, ScrollTrigger } = useGsap();
    if (!prefersReducedMotion()) {
      this.lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      this.lenis.on('scroll', (l: Lenis) => {
        this.velocity = l.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add((time) => this.lenis?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    document.addEventListener('click', this.onAnchorClick, true);
    this.enhanceButtons();

    // Al navegar con fragmento (/#resenas) se desplaza con suavidad; al cambiar de página vuelve arriba.
    let lastPath = location.pathname;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      const tree = this.router.parseUrl(url);
      const path = url.split(/[?#]/)[0];
      const changedPage = path !== lastPath;
      lastPath = path;
      requestAnimationFrame(() => {
        if (changedPage) this.scrollTo(0, true);
        const el = tree.fragment ? document.getElementById(tree.fragment) : null;
        if (el) setTimeout(() => this.scrollTo(el, false), changedPage ? 160 : 0);
        ScrollTrigger.refresh();
      });
    });
  }

  /** Detiene el scroll de la página (ventanas abiertas). Se puede anidar. */
  lock() {
    if (!this.isBrowser) return;
    this.locks++;
    this.lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  }

  unlock() {
    if (!this.isBrowser) return;
    this.locks = Math.max(0, this.locks - 1);
    if (this.locks) return;
    this.lenis?.start();
    document.documentElement.style.overflow = '';
  }

  scrollTo(target: HTMLElement | number, immediate = false, offset = -80) {
    if (this.lenis) this.lenis.scrollTo(target, { offset, immediate, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: immediate ? 'auto' : 'smooth' });
  }

  /**
   * Botones vivos (el texto que rueda va en <span class="btn-t"> en cada plantilla). Con mouse, el relleno nace
   * donde entró el cursor, se retira por donde salió.
   */
  private enhanceButtons() {
    if (!hasFinePointer()) return;
    let active: HTMLElement | null = null;
    const place = (btn: HTMLElement, e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener(
      'pointerover',
      (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn');
        if (btn === active) return;
        if (active) this.releaseButton(active, e);
        active = btn;
        if (btn) place(btn, e);
      },
      { passive: true },
    );
        document.addEventListener(
      'pointerout',
      (e) => {
        if (!active) return;
        const to = e.relatedTarget as HTMLElement | null;
        if (to && active.contains(to)) return;
        this.releaseButton(active, e);
        active = null;
      },
      { passive: true },
    );
  }

  private releaseButton(btn: HTMLElement, e: PointerEvent) {
    // El relleno se retira hacia el punto por donde salió el cursor.
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
    btn.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  // Los enlaces "#seccion" se desplazan con Lenis en lugar del salto nativo.
  private readonly onAnchorClick = (e: MouseEvent) => {
    const link = (e.target as HTMLElement).closest('a');
    const href = link?.getAttribute('href');
    if (!href || href === '#' || !href.startsWith('#')) return;
    const el = document.querySelector<HTMLElement>(href);
    if (!el) return;
    e.preventDefault();
    this.scrollTo(el);
  };
}
