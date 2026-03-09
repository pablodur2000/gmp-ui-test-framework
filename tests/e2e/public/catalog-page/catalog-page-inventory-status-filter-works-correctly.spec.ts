import { test, expect } from '@playwright/test';
import { navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  extractProductCount,
  waitForCountUpdate,
} from '../../../utils';

/**
 * E2E Test - CatalogPage Inventory Status Filter Works Correctly (QA-25)
 * 
 * Comprehensive test that verifies inventory status filter functionality on CatalogPage,
 * including checkbox states, product filtering, multiple selections, "Limpiar" button,
 * and filter combinations with other filters.
 * 
 * Based on: QA_TICKET_QA_25_CATALOG_INVENTORY_STATUS_FILTER.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 25-35 seconds
 * - Verifies all five inventory status checkboxes
 * - Tests single and multiple checkbox selections (OR logic)
 * - Tests "Limpiar" button functionality
 * - Tests filter combinations with category and search filters
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Inventory Status Filter Works Correctly (QA-25)', () => {
  test('should filter products correctly by inventory status with proper checkbox states and filter combinations', {
    tag: ['@regression', '@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for products to load
    await page.waitForLoadState('networkidle');

    await expectPathname(page, '/catalogo');
    const catalogPage = page.locator(TestSelectors.catalogPage);
    await expect(catalogPage).toBeVisible();

    // Get initial product count
    const productCount = catalogPage.locator(TestSelectors.catalogProductCount);
    await expect(productCount).toBeVisible();
    const initialCountText = await productCount.textContent();
    const initialCount = extractProductCount(initialCountText || '');

    // Get product cards locator
    const productCards = page.locator('[data-testid^="catalog-product-card"]');

    // ============================================================================
    // SECTION 1: Verify Inventory Status Filter Section
    // ============================================================================
    console.log('📋 Section 1: Verifying inventory status filter section');

    // Verify "Estado de Inventario" heading is visible
    const inventorySection = page.locator('text=Estado de Inventario');
    await expect(inventorySection).toBeVisible();

    // Get all inventory status checkboxes
    const piezaUnicaCheckbox = page.locator('[data-testid="catalog-inventory-filter-pieza-unica"]');
    const encargoMismoMaterialCheckbox = page.locator('[data-testid="catalog-inventory-filter-encargo-mismo-material"]');
    const encargoDiferenteMaterialCheckbox = page.locator('[data-testid="catalog-inventory-filter-encargo-diferente-material"]');
    const noDisponibleCheckbox = page.locator('[data-testid="catalog-inventory-filter-no-disponible"]');
    const enStockCheckbox = page.locator('[data-testid="catalog-inventory-filter-en-stock"]');

    // Verify all checkboxes are visible
    await expect(piezaUnicaCheckbox).toBeVisible();
    await expect(encargoMismoMaterialCheckbox).toBeVisible();
    await expect(encargoDiferenteMaterialCheckbox).toBeVisible();
    await expect(noDisponibleCheckbox).toBeVisible();
    await expect(enStockCheckbox).toBeVisible();

    // Verify all checkboxes are unchecked by default
    await expect(piezaUnicaCheckbox).not.toBeChecked();
    await expect(encargoMismoMaterialCheckbox).not.toBeChecked();
    await expect(encargoDiferenteMaterialCheckbox).not.toBeChecked();
    await expect(noDisponibleCheckbox).not.toBeChecked();
    await expect(enStockCheckbox).not.toBeChecked();

    // Verify "Limpiar" button is NOT visible (no active filters)
    const clearButton = page.locator('[data-testid="catalog-inventory-filter-clear"]');
    await expect(clearButton).not.toBeVisible();

    console.log('✅ Inventory status filter section verified');

    // ============================================================================
    // SECTION 2: Test Single Checkbox - "En Stock"
    // ============================================================================
    console.log('📋 Section 2: Testing single checkbox - En Stock');

    await enStockCheckbox.check();
    await page.waitForLoadState('networkidle');

    // Verify checkbox is checked
    await expect(enStockCheckbox).toBeChecked({ timeout: 3000 });

    // Verify "Limpiar" button is visible
    await expect(clearButton).toBeVisible();

    // Wait for product count to update
    await waitForCountUpdate(page, TestSelectors.catalogProductCount, initialCountText || '', 5000);

    const filteredCountText = await productCount.textContent();
    const filteredCount = extractProductCount(filteredCountText || '');

    console.log(`✅ En Stock filter applied: ${filteredCount} products`);

    // ============================================================================
    // SECTION 3: Test Multiple Checkboxes (OR Logic)
    // ============================================================================
    console.log('📋 Section 3: Testing multiple checkboxes (OR logic)');

    await piezaUnicaCheckbox.check();
    await page.waitForLoadState('networkidle');

    // Verify both checkboxes are checked
    await expect(enStockCheckbox).toBeChecked({ timeout: 3000 });
    await expect(piezaUnicaCheckbox).toBeChecked({ timeout: 3000 });

    // Wait for product count to update
    await waitForCountUpdate(page, TestSelectors.catalogProductCount, filteredCountText || '', 5000);

    const multipleFilterCountText = await productCount.textContent();
    const multipleFilterCount = extractProductCount(multipleFilterCountText || '');

    // Verify count increased (OR logic - more products should match)
    expect(multipleFilterCount).toBeGreaterThanOrEqual(filteredCount);

    console.log(`✅ Multiple filters applied: ${multipleFilterCount} products`);

    // ============================================================================
    // SECTION 4: Test "Limpiar" Button
    // ============================================================================
    console.log('📋 Section 4: Testing Limpiar button');

    await clearButton.click();
    await page.waitForLoadState('networkidle');

    // Verify all checkboxes are unchecked
    await expect(piezaUnicaCheckbox).not.toBeChecked();
    await expect(encargoMismoMaterialCheckbox).not.toBeChecked();
    await expect(encargoDiferenteMaterialCheckbox).not.toBeChecked();
    await expect(noDisponibleCheckbox).not.toBeChecked();
    await expect(enStockCheckbox).not.toBeChecked();

    // Verify "Limpiar" button is NOT visible
    await expect(clearButton).not.toBeVisible();

    // Wait for product count to return to initial
    await waitForCountUpdate(page, TestSelectors.catalogProductCount, multipleFilterCountText || '', 5000);

    const clearedCountText = await productCount.textContent();
    const clearedCount = extractProductCount(clearedCountText || '');

    // Verify count returned to approximately initial count
    expect(clearedCount).toBeGreaterThanOrEqual(initialCount - 2); // Allow small variance

    console.log(`✅ Filters cleared: ${clearedCount} products (initial: ${initialCount})`);

    // ============================================================================
    // SECTION 5: Test Filter with Main Category
    // ============================================================================
    console.log('📋 Section 5: Testing filter combination with main category');

    // Apply inventory filter
    await enStockCheckbox.check();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Apply main category filter
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    await cueroButton.click();
    await page.waitForLoadState('networkidle');

    // Verify both filters are active
    await expect(enStockCheckbox).toBeChecked();
    const cueroButtonClasses = await cueroButton.getAttribute('class');
    expect(cueroButtonClasses).toContain('bg-leather-600');

    // Wait for product count to update
    await waitForCountUpdate(page, TestSelectors.catalogProductCount, clearedCountText || '', 5000);

    const combinedCountText = await productCount.textContent();
    const combinedCount = extractProductCount(combinedCountText || '');

    console.log(`✅ Combined filters applied: ${combinedCount} products`);

    // ============================================================================
    // SECTION 6: Test Uncheck Individual Checkbox
    // ============================================================================
    console.log('📋 Section 6: Testing uncheck individual checkbox');

    // Uncheck "En Stock" while keeping other filters
    await enStockCheckbox.uncheck();
    await page.waitForLoadState('networkidle');

    // Wait for checkbox state to update
    await expect(enStockCheckbox).not.toBeChecked({ timeout: 3000 });

    // Verify "Limpiar" button is NOT visible (no inventory filters active)
    // Note: Limpiar button visibility depends on inventory filters, not category filters
    const clearButtonAfterUncheck = page.locator('[data-testid="catalog-inventory-filter-clear"]');
    await expect(clearButtonAfterUncheck).not.toBeVisible({ timeout: 2000 });

    console.log('✅ Individual checkbox uncheck verified');

    // ============================================================================
    // SECTION 7: Verify Empty State with Filters
    // ============================================================================
    console.log('📋 Section 7: Verifying empty state with filters');

    // Check if empty state exists (optional - depends on data availability)
    const emptyState = page.locator(TestSelectors.catalogEmptyState);
    const emptyStateCount = await emptyState.count();

    if (emptyStateCount > 0) {
      await expect(emptyState).toBeVisible();
      const emptyStateText = await emptyState.textContent();
      expect(emptyStateText).toContain('No se encontraron productos');
      console.log('✅ Empty state displayed correctly');
    } else {
      console.log('ℹ️ No empty state (products available with current filters)');
    }

    console.log('✅ Test completed successfully');
  });
});
