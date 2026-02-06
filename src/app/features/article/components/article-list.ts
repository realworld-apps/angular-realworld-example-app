import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { Articles } from '../services/articles';
import { ArticleListConfig } from '../models/article-list-config.model';
import { ArticleModel } from '../models/article-model';
import { ArticlePreview } from './article-preview';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingState } from '../../../core/models/loading-state.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-article-list',
  template: `
    @if (loading() === LoadingState.LOADING) {
      <div class="article-preview">Loading articles...</div>
    }

    @if (loading() === LoadingState.LOADED) {
      @for (article of results(); track article.slug) {
        <app-article-preview [articleInput]="article" />
      } @empty {
        <div class="article-preview empty-feed-message">
          @if (isFollowingFeed) {
            Your feed is empty. Follow some users to see their articles here, or check out the
            <a routerLink="/">Global Feed</a>!
          } @else {
            No articles are here... yet.
          }
        </div>
      }

      <nav>
        <ul class="pagination">
          @for (pageNumber of totalPages(); track pageNumber) {
            <li class="page-item" [ngClass]="{ active: pageNumber === page() }">
              <button class="page-link" (click)="setPageTo(pageNumber)">
                {{ pageNumber }}
              </button>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  imports: [ArticlePreview, NgClass, RouterLink],
  styles: `
    .page-link {
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleList implements OnChanges {
  query!: ArticleListConfig;
  results = signal<ArticleModel[]>([]);
  page = signal(1);
  totalPages = signal<number[]>([]);
  loading = signal(LoadingState.NOT_LOADED);
  LoadingState = LoadingState;
  destroyRef = inject(DestroyRef);

  @Input() limit!: number;
  @Input() config!: ArticleListConfig;
  @Input() currentPage = 1;
  @Input() isFollowingFeed = false;
  @Output() pageChange = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges): void {
    const configChange = changes['config'];
    const pageChange = changes['currentPage'];

    if (configChange?.currentValue) {
      this.query = configChange.currentValue;
      // Only reset page if currentPage wasn't also provided in this change
      if (!pageChange?.currentValue) {
        this.page.set(1);
      }
    }

    if (pageChange?.currentValue) {
      this.page.set(pageChange.currentValue);
    }

    // Run query if we have a config and either config or page changed
    if (this.query && (configChange || pageChange)) {
      this.runQuery();
    }
  }

  constructor(private articlesService: Articles) {}

  setPageTo(pageNumber: number) {
    if (pageNumber !== this.page()) {
      this.page.set(pageNumber);
      this.pageChange.emit(pageNumber);
      this.runQuery();
    }
  }

  runQuery() {
    this.loading.set(LoadingState.LOADING);
    this.results.set([]);

    // Create limit and offset filter (if necessary)
    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = this.limit * (this.page() - 1);
    }

    this.articlesService
      .query(this.query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.loading.set(LoadingState.LOADED);
        this.results.set(data.articles);

        // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
        this.totalPages.set(
          Array.from(new Array(Math.ceil(data.articlesCount / this.limit)), (val, index) => index + 1),
        );
      });
  }
}
