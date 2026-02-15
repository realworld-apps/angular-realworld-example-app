import { test, expect } from '@playwright/test';
import { register, login, generateUniqueUser } from './helpers/auth';
import { registerUserViaAPI, updateUserViaAPI, createArticleViaAPI } from './helpers/api';
import { createArticle, generateUniqueArticle } from './helpers/articles';
import { addComment } from './helpers/comments';

/**
 * Tests for null/empty image and bio field handling.
 * Verifies that a default avatar SVG is shown when image is null or empty,
 * and that bio fields never render the literal text "null".
 */

test.describe('Null/Empty Image and Bio Handling', () => {
  // Brief cooldown between tests to avoid backend rate limiting
  test.afterEach(async ({ context }) => {
    await context.close();
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('newly registered user should show default avatar on profile page', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('.user-img');
    const profileImg = page.locator('.user-img');
    await expect(profileImg).toBeVisible();
    const src = await profileImg.getAttribute('src');
    expect(src).toContain('default-avatar.svg');
  });

  test('newly registered user should show default avatar in navbar', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    const navImg = page.locator('nav .user-pic');
    await expect(navImg).toBeVisible();
    const src = await navImg.getAttribute('src');
    expect(src).toContain('default-avatar.svg');
  });

  test('newly registered user should show default avatar on article meta', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    const article = generateUniqueArticle();
    await createArticle(page, article);
    const articleMetaImg = page.locator('.article-meta img').first();
    await expect(articleMetaImg).toBeVisible();
    const src = await articleMetaImg.getAttribute('src');
    expect(src).toContain('default-avatar.svg');
  });

  test('newly registered user should show default avatar in comment section', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    const article = generateUniqueArticle();
    await createArticle(page, article);
    await addComment(page, 'Test comment for avatar check');
    // Comment form author image
    const commentFormImg = page.locator('.comment-form .comment-author-img');
    await expect(commentFormImg).toBeVisible();
    const formSrc = await commentFormImg.getAttribute('src');
    expect(formSrc).toContain('default-avatar.svg');
    // Posted comment author image
    const commentImg = page.locator('.card:not(.comment-form) .comment-author-img').first();
    await expect(commentImg).toBeVisible();
    const commentSrc = await commentImg.getAttribute('src');
    expect(commentSrc).toContain('default-avatar.svg');
  });

  test('setting image should display custom avatar on profile page', async ({ page, request }) => {
    const user = generateUniqueUser();
    const token = await registerUserViaAPI(request, user);
    const testImage = 'https://api.realworld.io/images/smiley-cyrus.jpeg';
    await updateUserViaAPI(request, token, { image: testImage });
    await login(page, user.email, user.password);
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('.user-img');
    const profileImg = page.locator('.user-img');
    await expect(profileImg).toHaveAttribute('src', testImage);
  });

  test('clearing image to empty string should restore default avatar', async ({ page, request }) => {
    const user = generateUniqueUser();
    const token = await registerUserViaAPI(request, user);
    // Set then clear
    await updateUserViaAPI(request, token, { image: 'https://api.realworld.io/images/smiley-cyrus.jpeg' });
    await updateUserViaAPI(request, token, { image: '' });
    await login(page, user.email, user.password);
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('.user-img');
    const profileImg = page.locator('.user-img');
    const src = await profileImg.getAttribute('src');
    expect(src).toContain('default-avatar.svg');
  });

  test('null bio should not render as literal "null" on profile page', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('.user-info');
    const bioText = await page.locator('.user-info p').textContent();
    expect(bioText?.trim()).not.toBe('null');
    expect(bioText?.trim()).toBe('');
  });

  test('setting then clearing bio should not show stale data', async ({ page, request }) => {
    const user = generateUniqueUser();
    const token = await registerUserViaAPI(request, user);
    const testBio = 'This is a test bio';
    await updateUserViaAPI(request, token, { bio: testBio });
    await updateUserViaAPI(request, token, { bio: '' });
    await login(page, user.email, user.password);
    await page.goto(`/profile/${user.username}`, { waitUntil: 'load' });
    await page.waitForSelector('.user-info');
    const bioText = await page.locator('.user-info p').textContent();
    expect(bioText?.trim()).not.toBe(testBio);
    expect(bioText?.trim()).not.toBe('null');
  });

  test('settings form should show empty string for null image', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    await page.goto('/settings', { waitUntil: 'load' });
    await expect(page.locator('input[formControlName="image"]')).toHaveValue('');
  });

  test('settings form should show empty string for null bio', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);
    await page.goto('/settings', { waitUntil: 'load' });
    await expect(page.locator('textarea[formControlName="bio"]')).toHaveValue('');
  });

  test('default avatar should display on other user articles in feed', async ({ page, request }) => {
    // Create a user with no image who has an article
    const author = generateUniqueUser();
    const token = await registerUserViaAPI(request, author);
    const uniqueId = Date.now();
    await createArticleViaAPI(request, token, {
      title: `Null avatar test ${uniqueId}`,
      description: `Description ${uniqueId}`,
      body: `Body content ${uniqueId}`,
    });
    // View the article as a different user and check the author avatar
    const viewer = generateUniqueUser();
    await register(page, viewer.username, viewer.email, viewer.password);
    await page.goto('/', { waitUntil: 'load' });
    // Find the article in the global feed
    await page.locator('a.nav-link', { hasText: 'Global Feed' }).click();
    await page.waitForSelector('.article-preview', { timeout: 10000 });
    const articlePreview = page.locator('.article-preview', { hasText: `Null avatar test ${uniqueId}` });
    await expect(articlePreview).toBeVisible();
    // The author avatar in the article preview should be the default
    const authorImg = articlePreview.locator('.article-meta img');
    const src = await authorImg.getAttribute('src');
    expect(src).toContain('default-avatar.svg');
  });
});
