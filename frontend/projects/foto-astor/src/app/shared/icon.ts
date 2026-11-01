import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up-right'
  | 'close'
  | 'star'
  | 'heart'
  | 'heart-fill'
  | 'instagram'
  | 'whatsapp'
  | 'mail'
  | 'phone'
  | 'pin'
  | 'download'
  | 'copy'
  | 'check'
  | 'plus'
  | 'play'
  | 'flip'
  | 'drag'
  | 'calendar'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'camera'
  | 'verified'
  | 'send'
  | 'expand'
  | 'scroll'
  | 'pause'
  | 'skip-back'
  | 'skip-forward';

/** Íconos de línea dibujados con plantillas (el prerender no admite innerHTML en SVG). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="stroke()"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (name()) {
        @case ('arrow-right') { <path d="M4 12h16M14 6l6 6-6 6" /> }
        @case ('arrow-left') { <path d="M20 12H4M10 6l-6 6 6 6" /> }
        @case ('arrow-up-right') { <path d="M7 17 17 7M8 7h9v9" /> }
        @case ('close') { <path d="M6 6l12 12M18 6 6 18" /> }
        @case ('star') { <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" fill="currentColor" stroke="none" /> }
        @case ('heart') { <path d="M12 20s-7.5-4.4-9.2-9.1C1.6 7.5 3.9 4.5 7.1 4.5c2 0 3.6 1.1 4.9 3 1.3-1.9 2.9-3 4.9-3 3.2 0 5.5 3 4.3 6.4C19.5 15.6 12 20 12 20Z" /> }
        @case ('heart-fill') { <path d="M12 20s-7.5-4.4-9.2-9.1C1.6 7.5 3.9 4.5 7.1 4.5c2 0 3.6 1.1 4.9 3 1.3-1.9 2.9-3 4.9-3 3.2 0 5.5 3 4.3 6.4C19.5 15.6 12 20 12 20Z" fill="currentColor" /> }
        @case ('instagram') { <rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /> }
        @case ('whatsapp') { <path d="M20 11.6a8 8 0 0 1-11.8 7l-4.2 1.2 1.3-4A8 8 0 1 1 20 11.6Z" /><path d="M9 8.8c0 3.3 2.9 6.2 6.2 6.2l1.2-1.4-1.8-1-.9.8a4.2 4.2 0 0 1-2.4-2.4l.8-.9-1-1.8L9.7 8.8" /> }
        @case ('mail') { <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /> }
        @case ('phone') { <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /> }
        @case ('pin') { <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /> }
        @case ('download') { <path d="M12 4v11M7 10l5 5 5-5M5 20h14" /> }
        @case ('copy') { <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /> }
        @case ('check') { <path d="m5 12.5 4.5 4.5L19 7.5" /> }
        @case ('plus') { <path d="M12 5v14M5 12h14" /> }
        @case ('play') { <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" /> }
        @case ('flip') { <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 3v4h-4M6 21v-4h4" /> }
        @case ('drag') { <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L3.7 15a1.6 1.6 0 0 1 2.3-2.2L9 15.5" /> }
        @case ('calendar') { <rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /> }
        @case ('chevron-left') { <path d="m15 5-7 7 7 7" /> }
        @case ('chevron-right') { <path d="m9 5 7 7-7 7" /> }
        @case ('chevron-down') { <path d="m5 9 7 7 7-7" /> }
        @case ('camera') { <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.6" /> }
        @case ('verified') { <path d="m12 2.5 2.4 1.7 2.9-.1.9 2.8 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-.9 2.8-2.9-.1L12 21.5l-2.4-1.7-2.9.1-.9-2.8-2.4-1.7.9-2.8-.9-2.8 2.4-1.7.9-2.8 2.9.1L12 2.5Z" fill="currentColor" stroke="none" /><path d="m8.5 12 2.3 2.3 4.7-4.6" stroke="#fff" /> }
        @case ('send') { <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" /> }
        @case ('expand') { <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /> }
        @case ('pause') { <path d="M8 5v14M16 5v14" stroke-width="3" /> }
        @case ('skip-back') { <path d="M6 5v14" /><path d="M19 5.5v13L9 12l10-6.5Z" fill="currentColor" /> }
        @case ('skip-forward') { <path d="M18 5v14" /><path d="M5 5.5v13L15 12 5 5.5Z" fill="currentColor" /> }
        @case ('scroll') { <rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v4" /> }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
    svg { display: block; }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly stroke = input(1.6);
}
