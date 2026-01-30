import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { ArticleModel } from '../models/article.model';
import { ArticleMeta } from './article-meta';
import { RouterLink } from '@angular/router';

import { FavoriteButton } from './favorite-button';

@Component({
  selector: 'app-article-preview',
  template: `
    <div class="article-preview">
      <app-article-meta [article]="article()">
        <app-favorite-button [article]="article()" (toggle)="toggleFavorite($event)" class="pull-xs-right">
          {{ article().favoritesCount }}
        </app-favorite-button>
      </app-article-meta>

      <a [routerLink]="['/article', article().slug]" class="preview-link">
        <h1>{{ article().title }}</h1>
        <p>{{ article().description }}</p>
        <span>Read more...</span>
        <ul class="tag-list">
          @for (tag of article().tagList; track tag) {
            <li class="tag-default tag-pill tag-outline">
              {{ tag }}
            </li>
          }
        </ul>
      </a>
    </div>
  `,
  imports: [ArticleMeta, FavoriteButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlePreview {
  article = signal<ArticleModel>(null!);

  @Input({ required: true })
  set articleInput(value: ArticleModel) {
    this.article.set(value);
  }

  toggleFavorite(favorited: boolean): void {
    this.article.update(article => ({
      ...article,
      favorited,
      favoritesCount: favorited ? article.favoritesCount + 1 : article.favoritesCount - 1,
    }));
  }
}
