import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, switchMap } from 'rxjs';
import { NgClass } from '@angular/common';
import { Articles } from '../services/articles';
import { UserAuth } from '../../../core/auth/services/user-auth';
import { ArticleModel } from '../models/article.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      class="btn btn-sm"
      [ngClass]="{
        disabled: isSubmitting(),
        'btn-outline-primary': !article.favorited,
        'btn-primary': article.favorited,
      }"
      (click)="toggleFavorite()"
    >
      <i class="ion-heart"></i> <ng-content></ng-content>
    </button>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButton {
  destroyRef = inject(DestroyRef);
  isSubmitting = signal(false);

  @Input() article!: ArticleModel;
  @Output() toggle = new EventEmitter<boolean>();

  constructor(
    private readonly articleService: Articles,
    private readonly router: Router,
    private readonly userService: UserAuth,
  ) {}

  toggleFavorite(): void {
    this.isSubmitting.set(true);

    this.userService.isAuthenticated
      .pipe(
        switchMap(authenticated => {
          if (!authenticated) {
            void this.router.navigate(['/register']);
            return EMPTY;
          }

          if (!this.article.favorited) {
            return this.articleService.favorite(this.article.slug);
          } else {
            return this.articleService.unfavorite(this.article.slug);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toggle.emit(!this.article.favorited);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
