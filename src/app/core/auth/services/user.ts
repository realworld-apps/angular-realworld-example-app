import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, EMPTY, Subscription, timer } from 'rxjs';

import { Jwt } from './jwt';
import { map, distinctUntilChanged, tap, shareReplay, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from '../user.model';
import { Router } from '@angular/router';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

/**
 * User - Manages authentication state for the current user.
 *
 * ## Endpoints
 *
 * This service uses GET /user (not /users/:id or /profiles/:username):
 * - GET /user → Returns the authenticated user's own data (JWT token identifies who you are)
 * - GET /profiles/:username → Different endpoint for viewing any user's public profile (see Profile)
 *
 * ## Auth States
 *
 * - 'loading': Initial state, checking if stored token is valid
 * - 'authenticated': Token valid, user data loaded
 * - 'unauthenticated': No token or token invalid (4XX error)
 * - 'unavailable': Server error (5XX), token kept for retry
 *
 * ## Error Handling on GET /user
 *
 * - 4XX errors (400, 401, 403, 404): Token is invalid → logout, clear token
 * - 5XX errors (500, 503) or network errors: Server is down → keep token, auto-retry
 *
 * The distinction matters: a 401 means "your token is bad" (clear it), while a 500
 * means "server is broken" (keep the token, it might work when server recovers).
 *
 * ## Auto-Retry
 *
 * When in 'unavailable' state, the service automatically retries with exponential
 * backoff: 2s → 4s → 8s → 16s → 16s → ... (capped at 16s, retries indefinitely).
 * The UI shows "Connecting..." while retrying. User can also just reload the page.
 *
 * ## Global 401 Handling
 *
 * For other endpoints (not /user), 401 errors are caught by errorInterceptor
 * which calls purgeAuth() - this handles "token expired mid-session" scenarios.
 */
@Injectable({ providedIn: 'root' })
export class User {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  private authStateSubject = new BehaviorSubject<AuthState>('loading');
  public authState = this.authStateSubject.asObservable().pipe(distinctUntilChanged());

  public isAuthenticated = this.currentUser.pipe(map(user => !!user));

  /**
   * Synchronously get the current cached user value.
   * Returns null if not authenticated or still loading.
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.getValue();
  }

  private retryAttempt = 0;
  private retrySubscription: Subscription | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly jwtService: Jwt,
    private readonly router: Router,
  ) {}

  login(credentials: { email: string; password: string }): Observable<{ user: User }> {
    return this.http
      .post<{ user: User }>('/users/login', { user: credentials })
      .pipe(tap(({ user }) => this.setAuth(user)));
  }

  register(credentials: { username: string; email: string; password: string }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>('/users', { user: credentials }).pipe(tap(({ user }) => this.setAuth(user)));
  }

  logout(): void {
    this.purgeAuth();
    void this.router.navigate(['/']);
  }

  getCurrentUser(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>('/user').pipe(
      tap({
        next: ({ user }) => this.setAuth(user),
        error: (err: HttpErrorResponse) => this.handleAuthError(err),
      }),
      shareReplay(1),
      catchError(() => EMPTY),
    );
  }

  /**
   * Handle errors from /api/user endpoint
   * - 4XX errors: Token is invalid, logout the user
   * - 5XX/network errors: Server issue, enter "unavailable" mode (keep token, show placeholder)
   */
  private handleAuthError(err: HttpErrorResponse): void {
    const status = err.status;

    if (status >= 400 && status < 500) {
      // 4XX: Client error (invalid token, forbidden, etc.) - logout
      this.purgeAuth();
    } else {
      // 5XX or network error (status 0) - auth temporarily unavailable
      this.setAuthUnavailable();
    }
  }

  /**
   * Set auth state to unavailable (server error, but keep token for retry)
   */
  private setAuthUnavailable(): void {
    this.currentUserSubject.next(null);
    this.authStateSubject.next('unavailable');
    this.scheduleRetry();
  }

  /**
   * Schedule auto-retry with exponential backoff: 2s, 4s, 8s, 16s, 16s, 16s...
   */
  private scheduleRetry(): void {
    this.cancelRetry();

    if (!this.jwtService.getToken()) {
      return; // No token, nothing to retry
    }

    // Calculate delay: 2, 4, 8, 16, 16, 16... (capped at 16s)
    const delaySeconds = Math.min(2 * Math.pow(2, this.retryAttempt), 16);
    this.retryAttempt++;

    this.retrySubscription = timer(delaySeconds * 1000).subscribe(() => {
      if (this.jwtService.getToken()) {
        this.authStateSubject.next('loading');
        this.getCurrentUser().subscribe();
      }
    });
  }

  /**
   * Cancel any pending retry
   */
  private cancelRetry(): void {
    if (this.retrySubscription) {
      this.retrySubscription.unsubscribe();
      this.retrySubscription = null;
    }
  }

  update(user: Partial<User>): Observable<{ user: User }> {
    return this.http.put<{ user: User }>('/user', { user }).pipe(
      tap(({ user }) => {
        this.currentUserSubject.next(user);
      }),
    );
  }

  setAuth(user: User): void {
    this.cancelRetry();
    this.retryAttempt = 0;
    this.jwtService.saveToken(user.token);
    this.currentUserSubject.next(user);
    this.authStateSubject.next('authenticated');
  }

  purgeAuth(): void {
    this.cancelRetry();
    this.retryAttempt = 0;
    this.jwtService.destroyToken();
    this.currentUserSubject.next(null);
    this.authStateSubject.next('unauthenticated');
  }
}
