import { Page } from '@playwright/test';

export async function addComment(page: Page, commentText: string) {
  // Assumes we're on an article page - wait for comment form to be ready
  await page.waitForSelector('textarea[placeholder="Write a comment..."]', { timeout: 10000 });
  await page.fill('textarea[placeholder="Write a comment..."]', commentText);

  // Get initial comment count (exclude the comment form itself)
  const initialCount = await page.locator('.card:not(.comment-form) .card-block').count();

  await page.click('button:has-text("Post Comment")');

  // Wait for a new comment to appear (count should increase by 1)
  await page.waitForFunction(
    expectedCount => document.querySelectorAll('.card:not(.comment-form) .card-block').length >= expectedCount,
    initialCount + 1,
    { timeout: 5000 },
  );
}

export async function deleteComment(page: Page, commentText: string) {
  // Find the comment card containing the text and click its delete button
  const commentCard = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  await commentCard.locator('span.mod-options i.ion-trash-a').click();

  // Wait for comment to disappear
}

export async function getCommentCount(page: Page): Promise<number> {
  // Exclude the comment form which also has .card .card-block structure
  const comments = await page.locator('.card:not(.comment-form) .card-block').count();
  return comments;
}
