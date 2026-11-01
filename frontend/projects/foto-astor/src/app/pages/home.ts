import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatesTeaser } from '../sections/dates-teaser';
import { EditSuite } from '../sections/edit-suite';
import { GalleryInvite } from '../sections/gallery-invite';
import { PhotoPile } from '../sections/photo-pile';
import { Reviews } from '../sections/reviews';
import { Services } from '../sections/services';
import { Venues } from '../sections/venues';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoPile, Venues, Services, GalleryInvite, EditSuite, Reviews, DatesTeaser],
  template: `
    <app-photo-pile />
    <app-venues />
    <app-services />
    <app-gallery-invite />
    <app-edit-suite />
    <app-reviews />
    <app-dates-teaser />
  `,
})
export default class Home {}
