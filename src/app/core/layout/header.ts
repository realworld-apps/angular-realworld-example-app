import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { User } from '../auth/services/user';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.html',
  imports: [RouterLinkActive, RouterLink, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private userService = inject(User);
  currentUser$ = this.userService.currentUser;
  authState$ = this.userService.authState;
}
