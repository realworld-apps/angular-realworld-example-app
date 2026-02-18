import { Page } from '@playwright/test';

export interface ArticleData {
  title: string;
  description: string;
  body: string;
  tags?: string[];
}

export async function createArticle(page: Page, article: ArticleData, options: { sleepAfter?: number } = {}) {
  const { sleepAfter = 1 } = options;

  await page.goto('/editor', { waitUntil: 'load' });

  await page.fill('input[name="title"]', article.title);
  await page.fill('input[name="description"]', article.description);
  await page.fill('textarea[name="body"]', article.body);

  if (article.tags && article.tags.length > 0) {
    for (const tag of article.tags) {
      await page.fill('input[placeholder="Enter tags"]', tag);
      await page.press('input[placeholder="Enter tags"]', 'Enter');
    }
  }

  // Start waiting for navigation before clicking to avoid race condition
  await Promise.all([page.waitForURL(/\/article\/.+/), page.click('button:has-text("Publish Article")')]);

  // Ensure Date.now() advances so the next generateUniqueArticle() gets a distinct timestamp
  if (sleepAfter > 0) {
    await new Promise(resolve => setTimeout(resolve, sleepAfter));
  }
}

export async function editArticle(page: Page, slug: string, updates: Partial<ArticleData>) {
  await page.goto(`/editor/${slug}`, { waitUntil: 'load' });

  // Wait for form to be populated before clearing/filling
  await page.waitForSelector('input[name="title"]');

  if (updates.title) {
    await page.fill('input[name="title"]', '');
    await page.fill('input[name="title"]', updates.title);
  }
  if (updates.description) {
    await page.fill('input[name="description"]', '');
    await page.fill('input[name="description"]', updates.description);
  }
  if (updates.body) {
    await page.fill('textarea[name="body"]', '');
    await page.fill('textarea[name="body"]', updates.body);
  }

  await Promise.all([page.waitForURL(/\/article\/.+/), page.click('button:has-text("Publish Article")')]);
}

export async function deleteArticle(page: Page) {
  // Assumes we're already on the article page
  await Promise.all([page.waitForURL('/'), page.click('button:has-text("Delete Article")')]);
}

export async function favoriteArticle(page: Page) {
  await page.click('button.btn-outline-primary:has-text("Favorite")');
  // Wait for the button to update to "Unfavorite"
  await page.waitForSelector('button.btn-primary:has-text("Unfavorite")');
}

export async function unfavoriteArticle(page: Page) {
  await page.click('button.btn-primary:has-text("Unfavorite")');
  // Wait for the button to update back to "Favorite"
  await page.waitForSelector('button.btn-outline-primary:has-text("Favorite")');
}

export function generateUniqueArticle(): ArticleData {
  const timestamp = Date.now();
  return {
    title: `Test Article ${timestamp}`,
    description: `Description for test article ${timestamp}`,
    body: `This is the body content for test article created at ${timestamp}. It contains enough text to be meaningful.`,
    tags: ['test', 'playwright'],
  };
}
