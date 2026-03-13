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
import { ArticlesService } from '../services/articles.service'; // Service for API interactions
import { ArticleListConfig } from '../models/article-list-config.model';
import { Article } from '../models/article.model'; // Interface defining article structure
import { ArticlePreviewComponent } from './article-preview.component';
import { NgClass } from '@angular/common'; // Directive for dynamic styling based on pagination state
import { RouterLink } from '@angular/router'; // Directive for internal application links
import { LoadingState } from '../../../core/models/loading-state.model'; // Enum for managing UI state transitions
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // Helper for clean Observable lifecycle management

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
              <button class="page-link" (click)="setPageTo(pageNumber)">{{ pageNumber }}</button>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  imports: [ArticlePreviewComponent, NgClass, RouterLink], // Standalone imports for component usage
  styles: `
    .page-link {
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance optimization for input-driven updates
})
export class ArticleListComponent implements OnChanges {
  query!: ArticleListConfig; // Internal state holding current query filters
  results = signal<Article[]>([]); // Signal holding the array of articles to display
  page = signal(1); // Signal tracking the local page state
  totalPages = signal<number[]>([]); // Signal generating the range of page numbers
  loading = signal(LoadingState.NOT_LOADED); // Signal driving the loading spinner logic
  LoadingState = LoadingState; // Exporting enum for use in template logic
  destroyRef = inject(DestroyRef); // Utility for automatic cleanup

  @Input() limit!: number; // Maximum articles per page
  @Input() config!: ArticleListConfig; // Global filter configuration
  @Input() currentPage = 1; // Input to sync with home page pagination state
  @Input() isFollowingFeed = false; // Flag to identify feed source for empty messages
  @Input() sortBy: 'newest' | 'comments' | 'favorites' = 'newest'; // MADE CHANGES HERE: Input to receive sorting preference from parent
  @Output() pageChange = new EventEmitter<number>(); // Event to notify parent of user navigation

  ngOnChanges(changes: SimpleChanges): void {
    // Lifecycle hook to react to input changes
    const configChange = changes['config']; // Detecting changes in filter settings
    const pageChange = changes['currentPage']; // Detecting changes in page number
    const sortChange = changes['sortBy']; // MADE CHANGES HERE: Detecting when sorting preference changes

    if (configChange?.currentValue) {
      this.query = configChange.currentValue; // Updating internal query state
      if (!pageChange?.currentValue) {
        this.page.set(1); // Resetting page to 1 when filters change
      }
    }

    if (pageChange?.currentValue) {
      this.page.set(pageChange.currentValue); // Updating signal with new input value
    }

    if (this.query && (configChange || pageChange || sortChange)) {
      this.runQuery(); // Triggering data fetch if any relevant input changes
    }
  }

  constructor(private articlesService: ArticlesService) {} // Injecting API service

  setPageTo(pageNumber: number) {
    if (pageNumber !== this.page()) {
      this.page.set(pageNumber); // Updating internal page signal
      this.pageChange.emit(pageNumber); // Emitting event to update URL in parent
      this.runQuery(); // Fetching new page data
    }
  }

  runQuery() {
    this.loading.set(LoadingState.LOADING); // Setting state to trigger loading UI
    this.results.set([]); // Clearing existing results during fetch

    if (this.limit) {
      this.query.filters.limit = this.limit; // Appending limit to filters
      this.query.filters.offset = this.limit * (this.page() - 1); // Calculating pagination offset
    }

    this.articlesService
      .query(this.query) // Calling backend service
      .pipe(takeUntilDestroyed(this.destroyRef)) // Automated subscription management
      .subscribe(data => {
        this.loading.set(LoadingState.LOADED); // Updating state to show articles

        // MADE CHANGES HERE: Client-side sorting logic
        let sortedArticles = data.articles;
        if (this.sortBy === 'comments') {
          sortedArticles = [...data.articles].sort((a, b) => b.commentsCount - a.commentsCount); // Sorting descending by comment count
        } else if (this.sortBy === 'favorites') {
          sortedArticles = [...data.articles].sort((a, b) => b.favoritesCount - a.favoritesCount); // Sorting descending by favorites
        }

        this.results.set(sortedArticles); // Updating the results signal with sorted data

        this.totalPages.set(
          Array.from(new Array(Math.ceil(data.articlesCount / this.limit)), (val, index) => index + 1),
        ); // Generating pagination range
      });
  }
}
