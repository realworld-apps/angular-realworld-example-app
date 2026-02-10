import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserAuth } from '../auth/services/user-auth';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.html',
  imports: [RouterLinkActive, RouterLink, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private userAuth = inject(UserAuth);
  currentUser$ = this.userAuth.currentUser;
  authState$ = this.userAuth.authState;
}
