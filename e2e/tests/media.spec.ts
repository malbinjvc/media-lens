import { test, expect } from "@playwright/test";

test.describe("Media Library", () => {
  test.beforeEach(async ({ page }) => {
    // Set a mock session token for testing
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("session_token", "test-token");
    });
  });

  test("should show media library page structure", async ({ page }) => {
    await page.goto("/media");
    await expect(page.getByText("Media Library")).toBeVisible();
  });

  test("should show upload area", async ({ page }) => {
    await page.goto("/media");
    await expect(
      page.getByText(/Drag & drop files here|browse/)
    ).toBeVisible();
  });

  test("should show projects page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByText("Projects")).toBeVisible();
  });

  test("should show search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Search")).toBeVisible();
    await expect(
      page.getByPlaceholder(/Search media/)
    ).toBeVisible();
  });

  test("should show analyze page", async ({ page }) => {
    await page.goto("/analyze");
    await expect(page.getByText("AI Analysis")).toBeVisible();
  });
});
