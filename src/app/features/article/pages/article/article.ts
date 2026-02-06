import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { User } from '../../../../core/auth/user.model';
import { Article } from '../../models/article.model';
import { Articles } from '../../services/articles';
import { Comments } from '../../services/comments';
import { User } from '../../../../core/auth/services/user';
import { ArticleMeta } from '../../components/article-meta';
import { AsyncPipe, NgClass } from '@angular/common';
import { MarkdownPipe } from '../../../../shared/pipes/markdown-pipe';
import { ListErrors } from '../../../../shared/components/list-errors';
import { ArticleComment } from '../../components/article-comment';
import { catchError } from 'rxjs/operators';
import { combineLatest, EMPTY } from 'rxjs';
import { Comment } from '../../models/comment.model';
import { IfAuthenticated } from '../../../../core/auth/if-authenticated';
import { Errors } from '../../../../core/models/errors.model';
import { Profile } from '../../../profile/models/profile.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FavoriteButton } from '../../components/favorite-button';
import { FollowButton } from '../../../profile/components/follow-button';

@Component({
  selector: 'app-article-page',
  templateUrl: './article.html',
  imports: [
    ArticleMeta,
    RouterLink,
    NgClass,
    FollowButton,
    FavoriteButton,
    MarkdownPipe,
    AsyncPipe,
    ListErrors,
    FormsModule,
    ArticleComment,
    ReactiveFormsModule,
    IfAuthenticated,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Article implements OnInit {
  article = signal<Article | null>(null);
  currentUser = signal<User | null>(null);
  comments = signal<Comment[]>([]);
  canModify = signal(false);
  errors = signal<Errors | null>(null);

  commentControl = new FormControl<string>('', { nonNullable: true });
  commentFormErrors = signal<Errors | null>(null);
  deleteCommentErrors = signal<Errors | null>(null);

  isSubmitting = signal(false);
  isDeleting = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly articleService: Articles,
    private readonly commentsService: Comments,
    private readonly router: Router,
    private readonly userService: User,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.params['slug'];
    combineLatest([this.articleService.get(slug), this.commentsService.getAll(slug), this.userService.currentUser])
      .pipe(
        catchError(err => {
          this.errors.set(err.errors || { error: ['Failed to load article'] });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([article, comments, currentUser]) => {
        this.article.set(article);
        this.comments.set(comments);
        this.currentUser.set(currentUser);
        this.canModify.set(currentUser?.username === article.author.username);
      });
  }

  onToggleFavorite(favorited: boolean): void {
    this.article.update(article => {
      if (!article) return article;
      return {
        ...article,
        favorited,
        favoritesCount: favorited ? article.favoritesCount + 1 : article.favoritesCount - 1,
      };
    });
  }

  toggleFollowing(profile: Profile): void {
    this.article.update(article => {
      if (!article) return article;
      return {
        ...article,
        author: { ...article.author, following: profile.following },
      };
    });
  }

  deleteArticle(): void {
    const article = this.article();
    if (!article) return;

    this.isDeleting.set(true);

    this.articleService
      .delete(article.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.router.navigate(['/']);
      });
  }

  addComment() {
    const article = this.article();
    if (!article) return;

    this.isSubmitting.set(true);
    this.commentFormErrors.set(null);

    this.commentsService
      .add(article.slug, this.commentControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: comment => {
          this.comments.update(comments => [comment, ...comments]);
          this.commentControl.reset('');
          this.isSubmitting.set(false);
        },
        error: errors => {
          this.isSubmitting.set(false);
          this.commentFormErrors.set(errors);
        },
      });
  }

  deleteComment(comment: Comment): void {
    const article = this.article();
    if (!article) return;

    this.deleteCommentErrors.set(null);
    this.commentsService
      .delete(comment.id, article.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.comments.update(comments => comments.filter(item => item !== comment));
        },
        error: errors => {
          this.deleteCommentErrors.set(errors);
        },
      });
  }
}
