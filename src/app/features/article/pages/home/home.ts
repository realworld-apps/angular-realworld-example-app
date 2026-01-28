import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Tags } from '../../services/tags';
import { ArticleListConfig } from '../../models/article-list-config.model';
import { NgClass } from '@angular/common';
import { ArticleList } from '../../components/article-list';
import { combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserAuth } from '../../../../core/auth/services/user-auth';
import { RxLet } from '@rx-angular/template/let';
import { IfAuthenticated } from '../../../../core/auth/if-authenticated';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [NgClass, ArticleList, RxLet, IfAuthenticated, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
  isAuthenticated = signal(false);
  listConfig = signal<ArticleListConfig>({
    type: 'all',
    filters: {},
  });
  currentPage = signal(1);
  tags$ = inject(Tags)
    .getAll()
    .pipe(tap(() => this.tagsLoaded.set(true)));
  tagsLoaded = signal(false);
  isFollowingFeed = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly userService: UserAuth,
  ) {}

  ngOnInit(): void {
    combineLatest([this.userService.isAuthenticated, this.route.params, this.route.queryParams])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isAuthenticated, params, queryParams]) => {
        this.isAuthenticated.set(isAuthenticated);

        const tag = params['tag'];
        const feed = queryParams['feed'];
        const page = queryParams['page'] ? parseInt(queryParams['page'], 10) : 1;

        // If feed=following but not authenticated, redirect to login
        if (feed === 'following' && !isAuthenticated) {
          void this.router.navigate(['/login']);
          return;
        }

        let type: string;
        let filters: { tag?: string } = {};

        if (tag) {
          type = 'all';
          filters = { tag };
        } else if (feed === 'following') {
          type = 'feed';
        } else {
          type = 'all';
        }

        this.currentPage.set(page);
        this.listConfig.set({ type, filters });
        this.isFollowingFeed.set(type === 'feed');
      });
  }

  onPageChange(page: number): void {
    const queryParams: { page?: number; feed?: string } = {};

    // Preserve feed param if present
    const currentFeed = this.route.snapshot.queryParams['feed'];
    if (currentFeed) {
      queryParams.feed = currentFeed;
    }

    // Only add page param if not page 1
    if (page > 1) {
      queryParams.page = page;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }
}
