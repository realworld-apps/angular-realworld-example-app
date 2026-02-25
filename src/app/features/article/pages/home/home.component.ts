import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TagsService } from '../../services/tags.service';
import { ArticleListConfig } from '../../models/article-list-config.model';
import { NgClass } from '@angular/common'; // Angular directive for conditional CSS classes; used for navigation tabs
import { ArticleListComponent } from '../../components/article-list.component';
import { combineLatest } from 'rxjs'; // RxJS function to combine multiple Observables; used to sync auth state and route params
import { tap } from 'rxjs/operators'; // RxJS operator for side effects; used to update the tagsLoaded signal
import { UserService } from '../../../../core/auth/services/user.service';
import { RxLet } from '@rx-angular/template/let'; // RxAngular directive for efficient template binding; used for tags list
import { IfAuthenticatedDirective } from '../../../../core/auth/if-authenticated.directive'; // Custom structural directive; toggles UI based on auth state
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // Angular utility for Observable cleanup; prevents memory leaks

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [NgClass, ArticleListComponent, RxLet, IfAuthenticatedDirective, RouterLink], // Defining standalone component dependencies for template execution
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimizing performance by checking for changes only when inputs or signals update
})
export default class HomeComponent implements OnInit {
  isAuthenticated = signal(false); // Reactive state for user authentication; updates UI reactively
  listConfig = signal<ArticleListConfig>({
    // State for article fetching parameters; determines which API endpoint is called
    type: 'all',
    filters: {},
  });
  sortBy = signal<'newest' | 'comments' | 'favorites'>('newest'); // MADE CHANGES HERE: Signal to track sorting preference; ensures UI remains in sync with the dropdown
  currentPage = signal(1); // Tracking current pagination index to manage data fetching
  tags$ = inject(TagsService) // Injecting service and creating Observable for tag list retrieval
    .getAll()
    .pipe(tap(() => this.tagsLoaded.set(true))); // Updating loading state once tags are fetched
  tagsLoaded = signal(false); // Flag to control visibility of loading vs content in sidebar
  isFollowingFeed = signal(false); // Flag used to toggle between global and personal feed UI
  destroyRef = inject(DestroyRef); // Injecting destruction context for automatic subscription cleanup

  constructor(
    private readonly router: Router, // Angular service for programmatic navigation
    private readonly route: ActivatedRoute, // Service to access current URL state and parameters
    private readonly userService: UserService, // Custom service for auth logic and user data
  ) {}

  ngOnInit(): void {
    combineLatest([this.userService.isAuthenticated, this.route.params, this.route.queryParams]) // Monitoring multiple state sources for routing logic
      .pipe(takeUntilDestroyed(this.destroyRef)) // Linking Observable lifetime to the component lifecycle
      .subscribe(([isAuthenticated, params, queryParams]) => {
        this.isAuthenticated.set(isAuthenticated); // Updating auth signal based on stream emission

        const tag = params['tag']; // Extracting tag from route params for filtered view
        const feed = queryParams['feed']; // Extracting feed type from query parameters
        const page = queryParams['page'] ? parseInt(queryParams['page'], 10) : 1; // Parsing page number for pagination logic

        if (feed === 'following' && !isAuthenticated) {
          void this.router.navigate(['/login']); // Redirecting guest users attempting to access private feed
          return;
        }

        let type: string;
        let filters: { tag?: string } = {};

        if (tag) {
          type = 'all';
          filters = { tag }; // Applying tag filter to the query config
        } else if (feed === 'following') {
          type = 'feed'; // Switching to private feed endpoint
        } else {
          type = 'all'; // Defaulting to global feed
        }

        this.currentPage.set(page); // Updating current page signal
        this.listConfig.set({ type, filters }); // Updating list configuration signal to trigger data fetch
        this.isFollowingFeed.set(type === 'feed'); // Updating feed mode flag
      });
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'newest' | 'comments' | 'favorites'; // Type-safe extraction of dropdown value
    this.sortBy.set(value); // Updating sorting signal to trigger re-sort in child component
  }

  onPageChange(page: number): void {
    const queryParams: { page?: number; feed?: string } = {}; // Building query object for navigation

    const currentFeed = this.route.snapshot.queryParams['feed']; // Accessing current query params snapshot
    if (currentFeed) {
      queryParams.feed = currentFeed; // Maintaining feed state during pagination
    }

    if (page > 1) {
      queryParams.page = page; // Only adding page param to URL if not on the first page
    }

    void this.router.navigate([], {
      // Performing in-place navigation to update URL
      relativeTo: this.route,
      queryParams,
    });
  }
}
