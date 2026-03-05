import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("should display OAuth login buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with GitHub")).toBeVisible();
  });

  test("should display MediaLens branding on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("MediaLens")).toBeVisible();
    await expect(
      page.getByText("AI-powered multi-modal content intelligence")
    ).toBeVisible();
  });

  test("should handle callback errors gracefully", async ({ page }) => {
    await page.goto("/callback");
    await expect(page.getByText(/Missing OAuth parameters|Back to login/)).toBeVisible();
  });
});
