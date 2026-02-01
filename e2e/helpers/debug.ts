import { Page } from '@playwright/test';

/**
 * Debug interface helpers for e2e tests.
 *
 * These helpers interact with window.__conduit_debug__, a standardized interface
 * that RealWorld implementations should expose for testing purposes.
 *
 * ## Implementation Guide
 *
 * Implementations should expose this interface on window.__conduit_debug__
 *
 * ```typescript
 * interface ConduitDebug {
 *   getToken: () => string | null;
 *   getAuthState: () => 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';
 *   getCurrentUser: () => User | null;
 * }
 * ```
 */

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

export interface User {
  username: string;
  email: string;
  bio: string | null;
  image: string | null;
  token: string;
}

/**
 * Get the current JWT token from the app's debug interface.
 * Returns null if no token is set or debug interface is not available.
 */
export async function getToken(page: Page): Promise<string | null> {
  return page.evaluate(() => window.__conduit_debug__?.getToken() ?? null);
}

/**
 * Get the current authentication state from the app's debug interface.
 * Returns undefined if debug interface is not available.
 */
export async function getAuthState(page: Page): Promise<AuthState | undefined> {
  return page.evaluate(() => window.__conduit_debug__?.getAuthState());
}

/**
 * Get the current user from the app's debug interface.
 * Returns null if not authenticated or debug interface is not available.
 */
export async function getCurrentUser(page: Page): Promise<User | null> {
  return page.evaluate(() => window.__conduit_debug__?.getCurrentUser() ?? null);
}

/**
 * Wait for a specific auth state to be reached.
 * Useful for waiting after login/logout operations.
 */
export async function waitForAuthState(
  page: Page,
  expectedState: AuthState,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  await page.waitForFunction(
    (state) => window.__conduit_debug__?.getAuthState() === state,
    expectedState,
    { timeout }
  );
}

/**
 * Check if the debug interface is available.
 * Can be used to skip tests if implementation doesn't support it.
 */
export async function isDebugInterfaceAvailable(page: Page): Promise<boolean> {
  return page.evaluate(() => typeof window.__conduit_debug__ !== 'undefined');
}
