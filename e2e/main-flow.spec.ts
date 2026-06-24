import { expect, test } from '@playwright/test';

test('create job, poll progress, and cancel', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('urls-input').fill(
    'https://example.com\nhttps://httpbin.org/status/404',
  );
  await page.getByTestId('create-job-btn').click();

  await expect(page.getByTestId('job-details')).toBeVisible();
  await expect(page.getByTestId('url-table')).toBeVisible({ timeout: 30_000 });

  const cancelButton = page.getByTestId('cancel-job-btn');
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
    await expect(page.getByText('Отменено')).toBeVisible({ timeout: 15_000 });
  }

  await page.getByTestId('refresh-jobs').click();
  await expect(page.getByTestId('job-item').first()).toBeVisible();
});
