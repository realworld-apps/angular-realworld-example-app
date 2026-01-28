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
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { ProfileDataAccess } from '../services/profile-data-access';
import { UserAuth } from '../../../core/auth/services/user-auth';
import { ProfileModel } from '../models/profile.model';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-follow-button',
  template: `
    <button
      class="btn btn-sm action-btn"
      [ngClass]="{
        disabled: isSubmitting(),
        'btn-outline-secondary': !profile.following,
        'btn-secondary': profile.following,
      }"
      (click)="toggleFollowing()"
    >
      <i class="ion-plus-round"></i>
      &nbsp;
      {{ profile.following ? 'Unfollow' : 'Follow' }} {{ profile.username }}
    </button>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowButton {
  @Input() profile!: ProfileModel;
  @Output() toggle = new EventEmitter<ProfileModel>();
  isSubmitting = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly profileService: ProfileDataAccess,
    private readonly router: Router,
    private readonly userService: UserAuth,
  ) {}

  toggleFollowing(): void {
    this.isSubmitting.set(true);

    this.userService.isAuthenticated
      .pipe(
        switchMap((isAuthenticated: boolean) => {
          if (!isAuthenticated) {
            void this.router.navigate(['/login']);
            return EMPTY;
          }

          if (!this.profile.following) {
            return this.profileService.follow(this.profile.username);
          } else {
            return this.profileService.unfollow(this.profile.username);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: profile => {
          this.isSubmitting.set(false);
          this.toggle.emit(profile);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
