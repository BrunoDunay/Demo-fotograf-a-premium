import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatesTeaser } from '../sections/dates-teaser';
import { FilmReel } from '../sections/film-reel';
import { GalleryInvite } from '../sections/gallery-invite';
import { PhotoPile } from '../sections/photo-pile';
import { Reviews } from '../sections/reviews';
import { Services } from '../sections/services';
import { Venues } from '../sections/venues';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoPile, Venues, Services, GalleryInvite, FilmReel, Reviews, DatesTeaser],
  template: `
    <app-photo-pile />
    <app-venues />
    <app-services />
    <app-gallery-invite />
    <app-film-reel />
    <app-reviews />
    <app-dates-teaser />
  `,
})
export default class Home {}
