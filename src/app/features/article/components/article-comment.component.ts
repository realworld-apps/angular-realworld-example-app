import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Comment } from '../models/comment.model';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-article-comment',
  template: `
    @if (comment) {
      @if (comment.status === 'REMOVED') {
        <div class="card">
          <div class="card-block">
            <p class="card-text">This comment has been deleted.</p>
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="card-block">
            <p class="card-text">
              {{ comment.body }}
            </p>
          </div>
          <div class="card-footer">
            <a class="comment-author" [routerLink]="['/profile', comment.author.username]">
              <img [src]="comment.author.image" class="comment-author-img" />
            </a>
            &nbsp;
            <a class="comment-author" [routerLink]="['/profile', comment.author.username]">
              {{ comment.author.username }}
            </a>
            <span class="date-posted">
              {{ comment.createdAt | date: 'longDate' }}
            </span>
            @if (canModify$ | async) {
              <span class="mod-options">
                <i class="ion-trash-a" (click)="delete.emit(true)"></i>
              </span>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      .comment {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

      .deleted {
        font-style: italic;
        color: #888;
      }

      .deleted-text {
        margin: 0;
      }
    `,
  ],
  imports: [RouterLink, DatePipe, AsyncPipe],
})
export class ArticleCommentComponent {
  @Input() comment!: Comment;
  @Output() delete = new EventEmitter<boolean>();

  canModify$ = inject(UserService).currentUser.pipe(
    map((userData: User | null) => userData?.username === this.comment.author.username),
  );
}
