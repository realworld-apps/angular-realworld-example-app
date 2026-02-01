import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserService } from '../auth/services/user.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  imports: [RouterLinkActive, RouterLink, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private userService = inject(UserService);
  currentUser$ = this.userService.currentUser;
  authState$ = this.userService.authState;
}
