import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { combineLatest, of, throwError } from 'rxjs';
import { UserAuth } from '../../../../core/auth/services/user-auth';
import { ProfileModel } from '../../models/profile.model';
import { ProfileDataAccess } from '../../services/profile-data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FollowButton } from '../../components/follow-button';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.html',
  imports: [FollowButton, RouterLink, RouterLinkActive, RouterOutlet, FollowButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  profile = signal<ProfileModel>(null!);
  isUser = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserAuth,
    private readonly profileService: ProfileDataAccess,
  ) {}

  ngOnInit() {
    this.profileService
      .get(this.route.snapshot.params['username'])
      .pipe(
        catchError(error => {
          void this.router.navigate(['/']);

          return throwError(() => error);
        }),
        switchMap(profile => {
          return combineLatest([of(profile), this.userService.currentUser]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([profile, user]) => {
        this.profile.set(profile);
        this.isUser.set(profile.username === user?.username);
      });
  }

  onToggleFollowing(profile: ProfileModel) {
    this.profile.set(profile);
  }
}
