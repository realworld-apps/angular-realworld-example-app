import { Injectable, PLATFORM_ID, inject } from '@angular/core'; // Importing core Angular utilities for dependency injection and platform identification.
import { isPlatformBrowser } from '@angular/common'; // Importing utility to check if the code is running in the browser to safely access localStorage.
import { BehaviorSubject } from 'rxjs'; // Importing BehaviorSubject to manage reactive theme state with an initial value.

export type ThemeMode = 'light' | 'dark'; // Defining a union type for theme modes to ensure type safety.

@Injectable({
  providedIn: 'root', // Registering the service at the root level so it is a singleton available throughout the app.
})
export class Theme {
  private platformId = inject(PLATFORM_ID); // Injecting PLATFORM_ID to distinguish between server-side and client-side execution.
  private readonly THEME_KEY = 'user-theme-preference'; // Defining a constant key for localStorage to maintain consistency.

  // Initializing BehaviorSubject with 'light' as requested.
  private themeSubject = new BehaviorSubject<ThemeMode>('light'); // Creating a BehaviorSubject to hold the current theme state.

  // Exposing the theme as an Observable for components to subscribe to.
  theme$ = this.themeSubject.asObservable(); // Creating a public Observable from the private Subject to follow the Observable pattern.

  constructor() {
    this.initializeTheme(); // Calling initialization logic when the service is instantiated.
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Checking if execution is in the browser to avoid errors during Server-Side Rendering (SSR).
      const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode; // Attempting to retrieve the previously saved theme from localStorage.
      if (savedTheme) {
        // Checking if a theme preference was actually found in storage.
        this.setTheme(savedTheme); // Applying the saved theme if it exists.
      } else {
        this.setTheme('light'); // Defaulting to light mode as per the project requirements.
      }
    }
  }

  toggleTheme(): void {
    const nextTheme = this.themeSubject.value === 'light' ? 'dark' : 'light'; // Determining the opposite of the current theme value.
    this.setTheme(nextTheme); // Updating the application state with the new theme.
  }

  private setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme); // Emitting the new theme value to all active subscribers.

    if (isPlatformBrowser(this.platformId)) {
      // Ensuring DOM and localStorage operations only happen in the browser.
      localStorage.setItem(this.THEME_KEY, theme); // Persisting the user's theme choice in localStorage for future sessions.

      if (theme === 'dark') {
        // Checking if the dark theme should be applied.
        document.body.classList.add('dark-theme'); // Adding the CSS class to the body to trigger global style overrides.
      } else {
        document.body.classList.remove('dark-theme'); // Removing the dark CSS class to revert to the default light theme.
      }
    }
  }
}
