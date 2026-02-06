import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleList } from '../../article/components/article-list';
import { ProfileDataAccess } from '../services/profile-data-access';
import { ProfileModel } from '../models/profile-model';
import { ArticleListConfig } from '../../article/models/article-list-config.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-articles',
  template: `@if (articlesConfig()) {
    <app-article-list [limit]="10" [config]="articlesConfig()!" />
  }`,
  imports: [ArticleList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileArticles implements OnInit {
  profile = signal<ProfileModel | null>(null);
  articlesConfig = signal<ArticleListConfig | null>(null);
  destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private readonly profileService: ProfileDataAccess,
  ) {}

  ngOnInit(): void {
    this.profileService
      .get(this.route.snapshot.params['username'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile: ProfileModel) => {
          this.profile.set(profile);
          this.articlesConfig.set({
            type: 'all',
            filters: {
              author: profile.username,
            },
          });
        },
      });
  }
}
