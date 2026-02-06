import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleList } from '../../article/components/article-list';
import { ProfileDataAccess } from '../services/profile-data-access';
import { ProfileModel } from '../models/profile-model';
import { ArticleListConfig } from '../../article/models/article-list-config.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-favorites',
  template: `@if (favoritesConfig()) {
    <app-article-list [limit]="10" [config]="favoritesConfig()!" />
  }`,
  imports: [ArticleList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileFavorites implements OnInit {
  profile = signal<ProfileModel | null>(null);
  favoritesConfig = signal<ArticleListConfig | null>(null);
  destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private readonly profileService: ProfileDataAccess,
  ) {}

  ngOnInit() {
    this.profileService
      .get(this.route.parent?.snapshot.params['username'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile: ProfileModel) => {
          this.profile.set(profile);
          this.favoritesConfig.set({
            type: 'all',
            filters: {
              favorited: profile.username,
            },
          });
        },
      });
  }
}
