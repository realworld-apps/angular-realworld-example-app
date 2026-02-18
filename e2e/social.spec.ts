import { test, expect } from '@playwright/test';
import { register, generateUniqueUser } from './helpers/auth';
import { createArticle, generateUniqueArticle } from './helpers/articles';
import { followUser, unfollowUser } from './helpers/profile';

test.describe('Social Features', () => {
  test.afterEach(async ({ context }) => {
    // Close the browser context to ensure complete isolation between tests.
    // This releases browser instances, network connections, and other resources.
    await context.close();
    // Wait 500ms to allow async cleanup operations to complete.
    // Without this delay, running 6+ tests in sequence causes flaky failures
    // due to resource exhaustion (network connections, file descriptors, etc).
    // This timing issue manifests as timeouts when loading article pages.
    // This will be investigated and fixed later.
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  test('should follow and unfollow a user', async ({ page }) => {
    // Register our test user
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Follow an existing demo user (johndoe is always available on demo backend)
    await followUser(page, 'johndoe');

    // Button should change to Unfollow
    await expect(page.locator('button:has-text("Unfollow")')).toBeVisible();

    // Unfollow johndoe
    await unfollowUser(page, 'johndoe');

    // Button should change back to Follow
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
  });

  test('should view own profile', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Click on profile link
    await page.click(`a[href="/profile/${user.username}"]`);

    // Should show user information
    await expect(page.locator('h4')).toHaveText(user.username);

    // Should see Edit Profile Settings button (own profile)
    await expect(page.locator('a[href="/settings"]').filter({ hasText: 'Edit Profile Settings' })).toBeVisible();

    // Should not see Follow button (can't follow yourself)
    await expect(page.locator('button:has-text("Follow")')).not.toBeVisible();
  });

  test('should view other user profile', async ({ page }) => {
    // Register our test user
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Visit johndoe's profile (existing demo user)
    await page.goto('/profile/johndoe', { waitUntil: 'load' });

    // Wait for profile page to load
    await page.waitForSelector('h4', { timeout: 10000 });

    // Should show johndoe's information
    await expect(page.locator('h4')).toHaveText('johndoe');

    // Should see Follow button (other user's profile)
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();

    // Should not see "Edit Profile Settings" button in the profile area (different from nav bar Settings link)
    await expect(
      page.locator('.user-info a[href="/settings"]').filter({ hasText: 'Edit Profile Settings' }),
    ).not.toBeVisible();

    // Should see johndoe's articles (demo backend has articles from johndoe)
    await expect(page.locator('.article-preview').first()).toBeVisible();
  });

  test('should display user articles on profile', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Create multiple articles (generate just-in-time so Date.now() is distinct)
    const article1 = generateUniqueArticle();
    await createArticle(page, article1);
    const article2 = generateUniqueArticle();
    await createArticle(page, article2);

    // Go to profile
    await page.goto(`/profile/${user.username}`);

    // Both articles should be visible (use .first() to avoid strict mode violation)
    await expect(page.locator(`h1:has-text("${article1.title}")`).first()).toBeVisible();
    await expect(page.locator(`h1:has-text("${article2.title}")`).first()).toBeVisible();
  });

  test('should display favorited articles on profile', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Go to global feed to find an existing article (can't favorite own articles)
    await page.goto('/', { waitUntil: 'load' });

    // Wait for articles to load
    await page.waitForSelector('.article-preview', { timeout: 10000 });

    // Get the title of the first article in the feed
    const firstArticleTitle = await page.locator('.article-preview h1').first().textContent();

    // Click on first article to go to its detail page
    await page.click('.article-preview h1:first-child');
    await page.waitForURL(/\/article\/.+/, { timeout: 10000 });

    // Wait for article page to load
    await page.waitForSelector('button:has-text("Favorite"), button:has-text("Unfavorite")', { timeout: 10000 });

    // Check if already favorited, if not favorite it
    const isFavorited = (await page.locator('button:has-text("Unfavorite")').count()) > 0;
    if (!isFavorited) {
      await page.click('button.btn-outline-primary:has-text("Favorite")');
      // Wait for the favorite to complete
      await page.waitForSelector('button.btn-primary:has-text("Unfavorite")', { timeout: 10000 });
    }

    // Go to profile and click Favorited tab
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('a:has-text("Favorited")', { timeout: 3000 });
    await page.click('a:has-text("Favorited")');

    // Wait for URL to change then for articles to load
    await expect(page).toHaveURL(`/profile/${user.username}/favorites`);
    await expect(page.locator('.article-preview').first()).toBeVisible({ timeout: 3000 });
  });

  test('should display followed users articles in feed', async ({ page }) => {
    // Register our test user
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    // Follow johndoe (existing demo user with articles)
    await followUser(page, 'johndoe');

    // Go to home and click "Your Feed"
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForSelector('.feed-toggle', { timeout: 10000 });
    await page.click('a:has-text("Your Feed")');

    // Wait for articles to load
    await page.waitForSelector('.article-preview', { timeout: 10000 });

    // Should see johndoe's articles in feed
    await expect(page.locator('.article-preview').first()).toBeVisible();
  });
});
