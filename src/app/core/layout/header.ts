import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserAuth } from '../auth/services/user-auth';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { IfAuthenticated } from '../auth/if-authenticated';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.html',
  imports: [RouterLinkActive, RouterLink, AsyncPipe, IfAuthenticated],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  currentUser$ = inject(UserAuth).currentUser;
}
