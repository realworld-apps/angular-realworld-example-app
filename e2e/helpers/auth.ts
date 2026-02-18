import { Page } from '@playwright/test';

export async function register(page: Page, username: string, email: string, password: string) {
  await page.goto('/register', { waitUntil: 'load' });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Wait for navigation to complete or error to appear
  try {
    await Promise.all([page.waitForURL('/'), page.click('button[type="submit"]')]);
  } catch (error) {
    // If navigation fails, check for errors
    const errorMsg = await page
      .locator('.error-messages')
      .textContent()
      .catch(() => '');
    if (errorMsg) {
      throw new Error(`Registration failed: ${errorMsg}`);
    }
    throw error;
  }
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'load' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Wait for navigation to complete or error to appear
  try {
    await Promise.all([page.waitForURL('/'), page.click('button[type="submit"]')]);
  } catch (error) {
    // If navigation fails, check for errors
    const errorMsg = await page
      .locator('.error-messages')
      .textContent()
      .catch(() => '');
    if (errorMsg) {
      throw new Error(`Login failed: ${errorMsg}`);
    }
    throw error;
  }
}

export async function logout(page: Page) {
  await page.click('a[href="/settings"]');
  await Promise.all([page.waitForURL('/'), page.click('button:has-text("Or click here to logout")')]);
}

export function generateUniqueUser() {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'password123',
  };
}
