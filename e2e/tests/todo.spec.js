const { test, expect } = require("@playwright/test");

test("can add a todo and see it in the list", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("Enter a todo");
    await input.fill("E2E test todo");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("E2E test todo")).toBeVisible();
});
