import { test, expect } from '@playwright/test';

/**
 * Navbar Search and Filter Functionality Tests
 *
 * Tests all search and category filtering scenarios including:
 * - Search functionality
 * - Category filtering
 * - Search results display
 * - Filter combinations
 */

test.describe('Navbar Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh on home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Search Functionality', () => {
    test('should display search input and button', async ({ page }) => {
      await expect(page.getByRole('searchbox', { name: /search for products/i })).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });

    test('should search for products and display results', async ({ page }) => {
      // Type search query
      await page.getByRole('searchbox', { name: /search for products/i }).fill('iPhone');

      // Click search button
      await page.locator('button[type="submit"]').first().click();

      // Wait for navigation
      await page.waitForURL('**/search?**');

      // Verify URL contains search query
      expect(page.url()).toContain('q=iPhone');

      // Verify search results are displayed
      await expect(page.getByText(/results for "iPhone"/i)).toBeVisible();

      // Verify products are displayed
      const products = page.locator('[role="main"] a[href*="/product/"]');
      await expect(products.first()).toBeVisible();
    });

    test('should display correct number of results', async ({ page }) => {
      // Search for iPhone
      await page.getByRole('searchbox', { name: /search for products/i }).fill('iPhone');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/search?**');

      // Verify results count
      const resultsText = await page.getByText(/\d+-\d+ of \d+ results/i).textContent();
      expect(resultsText).toBeTruthy();
    });

    test('should clear search and show all products', async ({ page }) => {
      // Perform search
      await page.getByRole('searchbox', { name: /search for products/i }).fill('iPhone');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/search?**');

      // Click clear button
      await page.getByRole('link', { name: /clear/i }).click();

      // Verify navigation to search page without query
      expect(page.url()).toContain('/search');
      expect(page.url()).not.toContain('q=');
    });
  });

  test.describe('Category Filter', () => {
    test('should display category navigation', async ({ page }) => {
      await expect(page.getByRole('link', { name: /laptops & computers/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /cc tv & camera/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /home equipment/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /tv & audios/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /printers & ink/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /gaming & fun/i })).toBeVisible();
    });

    test('should filter by Laptops category', async ({ page }) => {
      // Click Laptops category
      await page.getByRole('link', { name: /laptops & computers/i }).click();

      // Wait for navigation
      await page.waitForURL('**/search?category=Laptops');

      // Verify URL
      expect(page.url()).toContain('category=Laptops');

      // Verify category results
      await expect(page.getByText(/category: laptops/i)).toBeVisible();

      // Verify laptop products are displayed
      const products = page.locator('[role="main"] a[href*="/product/"]');
      await expect(products.first()).toBeVisible();
    });

    test('should filter by Cameras category', async ({ page }) => {
      // Click Cameras category
      await page.getByRole('link', { name: /cc tv & camera/i }).click();

      // Wait for navigation
      await page.waitForURL('**/search?category=Cameras');

      // Verify URL
      expect(page.url()).toContain('category=Cameras');
    });

    test('should filter by Smartphones from home page', async ({ page }) => {
      // Click Smartphones category from home carousel
      const smartphonesLink = page.getByRole('link', { name: /latest iphone 16 series/i }).first();
      await smartphonesLink.click();

      // Wait for navigation
      await page.waitForURL('**/search?category=Smartphones');

      // Verify URL
      expect(page.url()).toContain('category=Smartphones');
    });

    test('should show department filter on search results page', async ({ page }) => {
      // Navigate to search page
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Verify department filter is visible
      await expect(page.getByText('Department')).toBeVisible();

      // Verify department options
      await expect(page.getByRole('link', { name: 'Smartphones' }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Laptops' }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Tablets' }).first()).toBeVisible();
    });
  });

  test.describe('Combined Search and Filter', () => {
    test('should search and then filter by category', async ({ page }) => {
      // Search for a term
      await page.getByRole('searchbox', { name: /search for products/i }).fill('Apple');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/search?**');

      // Filter by category from sidebar
      await page.getByRole('link', { name: 'Smartphones' }).first().click();
      await page.waitForURL('**/search?**');

      // Verify both query and category are in URL
      expect(page.url()).toContain('q=Apple');
      expect(page.url()).toContain('category=Smartphones');
    });

    test('should filter by price range', async ({ page }) => {
      // Navigate to laptops
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Click price filter
      await page.getByRole('link', { name: '$51 to $1000' }).click();
      await page.waitForURL('**/search?**');

      // Verify price filter is applied
      expect(page.url()).toContain('price=51-1000');
    });

    test('should filter by customer rating', async ({ page }) => {
      // Navigate to search page
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Click rating filter
      await page.getByRole('link', { name: /rating.*4.*& up/i }).click();
      await page.waitForURL('**/search?**');

      // Verify rating filter is applied
      expect(page.url()).toContain('rating=4');
    });

    test('should filter by tag', async ({ page }) => {
      // Navigate to search page
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Wait for page to load
      await page.waitForSelector('text=Tag');

      // Click tag filter
      await page.getByRole('link', { name: 'Best Seller' }).click();
      await page.waitForURL('**/search?**');

      // Verify tag filter is applied
      expect(page.url()).toContain('tag=best-seller');
    });
  });

  test.describe('Sort Functionality', () => {
    test('should display sort dropdown', async ({ page }) => {
      // Navigate to search page
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Verify sort dropdown is visible
      await expect(page.getByText(/sort by/i)).toBeVisible();
    });

    test('should sort by best selling by default', async ({ page }) => {
      // Navigate to search page
      await page.getByRole('link', { name: /laptops & computers/i }).click();
      await page.waitForURL('**/search?**');

      // Verify default sort
      expect(page.url()).toContain('sort=best-selling');
    });
  });

  test.describe('Product Display', () => {
    test('should display product cards with required information', async ({ page }) => {
      // Search for products
      await page.getByRole('searchbox', { name: /search for products/i }).fill('iPhone');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/search?**');

      // Get first product card
      const firstProduct = page.locator('[role="main"] a[href*="/product/"]').first();

      // Verify product card is visible
      await expect(firstProduct).toBeVisible();

      // Verify product has image
      await expect(firstProduct.locator('img').first()).toBeVisible();
    });

    test('should navigate to product detail page on click', async ({ page }) => {
      // Search for products
      await page.getByRole('searchbox', { name: /search for products/i }).fill('iPhone');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/search?**');

      // Click first product
      const firstProductLink = page.locator('[role="main"] a[href*="/product/"]').first();
      await firstProductLink.click();

      // Verify navigation to product page
      await page.waitForURL('**/product/**');
      expect(page.url()).toContain('/product/');
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display search on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify search is visible
      await expect(page.getByRole('searchbox', { name: /search for products/i })).toBeVisible();
    });

    test('should display category navigation on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      // Verify category nav is visible
      await expect(page.getByRole('link', { name: /laptops & computers/i })).toBeVisible();
    });
  });
});
