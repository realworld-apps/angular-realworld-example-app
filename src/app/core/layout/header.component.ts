import { ChangeDetectionStrategy, Component, inject } from '@angular/core'; // Importing standard Angular component decorators and utilities.
import { UserService } from '../auth/services/user.service'; // Importing the user service to access authentication state.
import { RouterLink, RouterLinkActive } from '@angular/router'; // Importing routing directives for navigation.
import { AsyncPipe } from '@angular/common'; // Importing AsyncPipe to handle Observable subscriptions directly in the template.
import { DefaultImagePipe } from '../../shared/pipes/default-image.pipe'; // Importing custom pipe for fallback images.
import { Theme } from '../services/theme'; // Importing the newly updated Theme service for toggling capabilities.

@Component({
  selector: 'app-layout-header', // Defining the custom HTML tag used for this component.
  templateUrl: './header.component.html', // Linking the external HTML template file.
  imports: [RouterLinkActive, RouterLink, AsyncPipe, DefaultImagePipe], // Declaring dependencies used within the component's template.
  changeDetection: ChangeDetectionStrategy.OnPush, // Using OnPush for performance optimization as the UI only changes with input or Observable emissions.
})
export class HeaderComponent {
  private userService = inject(UserService); // Injecting the UserService using the functional inject() API.
  private themeService = inject(Theme); // Injecting the Theme service to handle dark/light mode toggling.

  currentUser$ = this.userService.currentUser; // Exposing the current user Observable for the template.
  authState$ = this.userService.authState; // Exposing the authentication state Observable for the template.
  theme$ = this.themeService.theme$; // Exposing the current theme Observable to the template for reactive UI updates.

  toggleTheme(): void {
    this.themeService.toggleTheme(); // Triggering the toggle logic within the Theme service when the button is clicked.
  }
}
