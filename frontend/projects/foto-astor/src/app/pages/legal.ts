import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BRAND } from '../core/content';
import { photo, photoSrc } from '../core/media';

interface Doc {
  title: string;
  script: string;
  photo: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string[] }[];
}

const B = BRAND;

const DOCS: Record<string, Doc> = {
  privacidad: {
    title: 'Aviso de privacidad',
    script: 'Tus datos, con cuidado',
    photo: 'velo-bn',
    updated: '31 de octubre de 2026',
    intro: `${B.person} (Astor Fotografía), con domicilio en ${B.address}, ${B.city}, Ags., es responsable del uso y protección de tus datos personales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`,
    sections: [
      { h: 'Qué datos recabo', p: ['Nombre, teléfono, correo electrónico, fecha y lugar de tu evento, número de invitados y lo que decidas contarme en tus mensajes. No recabo datos sensibles ni financieros a través de este sitio.'] },
      { h: 'Para qué los uso', p: ['Para responder tu solicitud, cotizar, apartar tu fecha, elaborar el contrato, coordinar el día del evento y entregarte tus fotos.', 'De forma secundaria, y solo si me das permiso, para enviarte promociones o pedirte una reseña. Puedes negarte escribiendo a ' + B.email + '.'] },
      { h: 'Tus fotografías', p: ['Las fotos de tu evento se guardan en tres copias seguras mientras dura el servicio y un año después. Solo las publico en redes o en este sitio con tu autorización por escrito.'] },
      { h: 'Con quién los comparto', p: ['No vendo ni comparto tus datos. Solo los conocen los proveedores necesarios para el servicio (laboratorio de impresión, segundo fotógrafo), obligados a la misma confidencialidad.'] },
      { h: 'Tus derechos ARCO', p: ['Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, o revocar tu consentimiento, escribiendo a ' + B.email + ' con tu nombre e identificación. Respondo en un máximo de 20 días hábiles.'] },
      { h: 'Cookies', p: ['Este sitio usa cookies necesarias y, si las aceptas, de medición. Consulta la política de cookies para más detalle.'] },
    ],
  },
  terminos: {
    title: 'Términos y condiciones',
    script: 'Lo que acordamos',
    photo: 'anillo-bn',
    updated: '31 de octubre de 2026',
    intro: 'Estas condiciones aplican a los servicios de fotografía de Astor Fotografía. El contrato que firmamos para tu evento las detalla y prevalece sobre este resumen.',
    sections: [
      { h: 'Apartado y pagos', p: ['La fecha se aparta con el 30 % del paquete y la firma del contrato. El resto se liquida a más tardar siete días antes del evento. Precios en pesos mexicanos; si requieres factura se suma el IVA.'] },
      { h: 'Cambios y cancelaciones', p: ['Si cambias la fecha con más de 90 días de anticipación, el anticipo se respeta para una nueva fecha disponible dentro de los siguientes 12 meses. Las cancelaciones no reembolsan el anticipo, porque esa fecha se dejó de ofrecer a alguien más.'] },
      { h: 'El día del evento', p: ['La cobertura empieza a la hora acordada. Las horas extra se cobran según la tarifa vigente. Necesito acceso a los espacios del evento y, si dura más de seis horas, un lugar en la mesa de proveedores.'] },
      { h: 'Entregas', p: ['Adelanto de 30 a 50 fotos en 72 horas y galería completa en un máximo de cinco semanas (dos semanas en eventos sociales). Los álbumes se entregan seis semanas después de que apruebes el diseño.'] },
      { h: 'Derechos de autor y uso', p: ['Las fotografías son obra de ' + B.person + '. Tienes derecho a usarlas para fines personales: imprimirlas, compartirlas y publicarlas con crédito. El uso comercial requiere autorización. Solo uso tus fotos en mi portafolio si lo autorizas en el contrato.'] },
      { h: 'Responsabilidad', p: ['Trabajo con equipo duplicado y respaldo triple. Si por causas de fuerza mayor no pudiera asistir, envío a un fotógrafo de confianza de nivel equivalente o reembolso lo pagado.'] },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    script: 'Una galleta, nada más',
    photo: 'zapatillas-bn',
    updated: '31 de octubre de 2026',
    intro: 'Las cookies son archivos pequeños que el navegador guarda para recordar tus preferencias. Aquí explico cuáles usa este sitio.',
    sections: [
      { h: 'Necesarias', p: ['Recuerdan tu elección sobre las cookies, si ya viste la intro y si activaste "Reducir movimiento". Sin ellas el sitio no recordaría tus preferencias. No identifican a nadie.'] },
      { h: 'De medición (opcionales)', p: ['Si aceptas, el sitio podría usar Google Analytics y el pixel de Meta para saber qué páginas y fotos interesan más. En esta demo no se carga ninguno de los dos.'] },
      { h: 'Cómo cambiar tu elección', p: ['Borra los datos del sitio en tu navegador y el aviso volverá a aparecer. Elegir "Solo necesarias" deja el sitio funcionando igual.'] },
    ],
  },
};

@Component({
  selector: 'app-legal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (doc(); as d) {
      <article class="legal on-night">
        <div class="bg" aria-hidden="true" [style.background-image]="'url(' + bg(d.photo) + ')'"></div>
        <div class="container inner">
          <p class="label brand">Astor · Fotografía</p>
          <h1 class="title">{{ d.title }}</h1>
          <p class="script sub">{{ d.script }}</p>
          <p class="intro">{{ d.intro }}</p>
          <ol class="timeline">
            @for (s of d.sections; track s.h) {
              <li>
                <span class="dot" aria-hidden="true"></span>
                <h2 class="h">{{ s.h }}</h2>
                @for (p of s.p; track p) {
                  <p class="p">{{ p }}</p>
                }
              </li>
            }
          </ol>
          <p class="updated label">Última actualización: {{ d.updated }} · Texto de ejemplo para un sitio demo.</p>
          <nav class="others" aria-label="Otros documentos">
            <a routerLink="/aviso-de-privacidad">Aviso de privacidad</a>
            <a routerLink="/terminos-y-condiciones">Términos y condiciones</a>
            <a routerLink="/cookies">Cookies</a>
          </nav>
        </div>
      </article>
    }
  `,
  styles: `
    .legal { position: relative; overflow: hidden; padding: 150px 0 110px; }
    .bg { position: absolute; inset: 0; background-size: cover; background-position: center 30%; filter: grayscale(1) brightness(0.48) contrast(1.05); scale: 1.04; }
    .bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(7 11 22 / 92%), rgb(7 11 22 / 55%) 70%, rgb(7 11 22 / 35%)); }
    .inner { position: relative; max-width: 860px; margin-inline: 0 auto; }
    .brand { color: var(--color-on-night-2); }
    .title { font-family: var(--font-display); font-style: italic; font-size: var(--text-3xl); margin-top: 18px; }
    .sub { font-size: clamp(2.2rem, 5vw, 3.4rem); color: var(--color-accent-soft); margin-top: 0.4em; }
    .intro { margin-top: 26px; max-width: 60ch; color: var(--color-on-night-2); font-size: 1.05rem; }
    .timeline { position: relative; margin-top: 56px; padding-left: 36px; display: grid; gap: 34px; }
    .timeline::before { content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 1px; background: rgb(233 236 243 / 55%); }
    .timeline li { position: relative; }
    .dot { position: absolute; left: -36px; top: 6px; width: 15px; height: 15px; border-radius: 50%; background: var(--color-on-night); }
    .h { font-family: var(--font-display); font-size: clamp(1.4rem, 2.6vw, 1.9rem); text-transform: uppercase; letter-spacing: 0.04em; }
    .p { margin-top: 10px; max-width: 64ch; color: rgb(233 236 243 / 78%); line-height: 1.7; }
    .updated { margin-top: 56px; color: var(--color-on-night-2); }
    .others { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 18px; }
    .others a { min-height: 44px; display: inline-flex; align-items: center; text-decoration: underline; text-underline-offset: 4px; color: var(--color-on-night-2); }
    @media (hover: hover) and (pointer: fine) { .others a:hover { color: var(--color-on-night); } }
  `,
})
export default class Legal {
  private readonly route = inject(ActivatedRoute);
  private readonly key = toSignal(this.route.data.pipe(map((d) => d['doc'] as string)), { initialValue: this.route.snapshot.data['doc'] as string });
  protected readonly doc = computed(() => DOCS[this.key()] ?? DOCS['privacidad']);

  protected bg(name: string) {
    return photoSrc(photo(name));
  }
}
