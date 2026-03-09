import { Page, Response } from '@playwright/test';

/**
 * API Verification Utility
 * 
 * Enhanced utilities for intercepting and verifying Supabase API calls,
 * including status codes, request structure, query parameters, and response data.
 * 
 * Usage:
 * ```typescript
 * const apiVerification = await waitForProductsApiCall(page, {
 *   searchTerm: 'billetera',
 *   category: 'cuero'
 * });
 * expect(apiVerification.status).toBe(200);
 * expect(apiVerification.url).toContain('billetera');
 * ```
 */

export interface ApiVerificationResult {
  /** HTTP status code */
  status: number;
  /** Full URL of the API call */
  url: string;
  /** Request method (GET, POST, etc.) */
  method: string;
  /** Parsed query parameters */
  queryParams: Record<string, string>;
  /** Response data (parsed JSON if available) */
  data: any;
  /** Whether the API call was received */
  received: boolean;
}

export interface ProductsApiFilters {
  /** Search term to verify in query */
  searchTerm?: string;
  /** Category filter to verify */
  category?: string;
  /** Main category filter to verify */
  mainCategory?: string;
  /** Inventory status filter to verify */
  inventoryStatus?: string | string[];
  /** Expected minimum number of products in response */
  minProducts?: number;
}

/**
 * Wait for and verify a products API call
 * 
 * @param page - Playwright Page object
 * @param filters - Filters to verify in the API call
 * @param timeout - Maximum wait time (default: 10000ms)
 * @returns API verification result
 */
export async function waitForProductsApiCall(
  page: Page,
  filters: ProductsApiFilters = {},
  timeout: number = 10000
): Promise<ApiVerificationResult> {
  const result: ApiVerificationResult = {
    status: 0,
    url: '',
    method: '',
    queryParams: {},
    data: null,
    received: false,
  };

  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      return url.includes('/rest/v1/products') && 
             response.request().method() === 'GET';
    },
    { timeout }
  );

  result.received = true;
  result.status = response.status();
  result.url = response.url();
  result.method = response.request().method();

  // Parse query parameters from URL
  const urlObj = new URL(response.url());
  urlObj.searchParams.forEach((value, key) => {
    result.queryParams[key] = value;
  });

  // Parse response data
  try {
    result.data = await response.json();
  } catch (e) {
    result.data = null;
  }

  // Verify filters
  if (filters.searchTerm) {
    const searchInUrl = result.url.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                       JSON.stringify(result.queryParams).toLowerCase().includes(filters.searchTerm.toLowerCase());
    if (!searchInUrl) {
      console.warn(`⚠️ Search term "${filters.searchTerm}" not found in API call URL or params`);
    }
  }

  if (filters.mainCategory) {
    // Main category filter uses main_category=eq.cuero or main_category=eq.macrame
    const mainCategoryValue = filters.mainCategory.toLowerCase();
    const mainCategoryInUrl = result.url.includes(`main_category=eq.${mainCategoryValue}`) ||
                              result.url.includes(`main_category=eq.${mainCategoryValue}`);
    if (!mainCategoryInUrl) {
      console.warn(`⚠️ Main category filter "${filters.mainCategory}" not found in API call URL`);
    }
  }

  if (filters.category) {
    const categoryInUrl = result.url.includes(`category_id=eq.`) || 
                          result.url.includes(`categories`);
    if (!categoryInUrl) {
      console.warn(`⚠️ Category filter not found in API call`);
    }
  }

  if (filters.inventoryStatus) {
    const statusArray = Array.isArray(filters.inventoryStatus) 
      ? filters.inventoryStatus 
      : [filters.inventoryStatus];
    const statusInUrl = statusArray.some(status => {
      const statusValue = status.toLowerCase().replace(/_/g, '-');
      return result.url.includes(`inventory_status=in.`) || 
             result.url.includes(`inventory_status=eq.${statusValue}`) ||
             result.url.includes(`inventory_status=eq.${status}`);
    });
    if (!statusInUrl) {
      console.warn(`⚠️ Inventory status filter not found in API call`);
    }
  }

  if (filters.minProducts && Array.isArray(result.data)) {
    if (result.data.length < filters.minProducts) {
      console.warn(`⚠️ Expected at least ${filters.minProducts} products, got ${result.data.length}`);
    }
  }

  return result;
}

/**
 * Wait for and verify a search API call
 * 
 * @param page - Playwright Page object
 * @param searchTerm - Search term to verify
 * @param timeout - Maximum wait time (default: 10000ms)
 * @returns API verification result
 */
export async function waitForSearchApiCall(
  page: Page,
  searchTerm: string,
  timeout: number = 10000
): Promise<ApiVerificationResult> {
  return await waitForProductsApiCall(page, { searchTerm }, timeout);
}

/**
 * Wait for and verify a categories API call
 * 
 * @param page - Playwright Page object
 * @param timeout - Maximum wait time (default: 10000ms)
 * @returns API verification result
 */
export async function waitForCategoriesApiCall(
  page: Page,
  timeout: number = 10000
): Promise<ApiVerificationResult> {
  const result: ApiVerificationResult = {
    status: 0,
    url: '',
    method: '',
    queryParams: {},
    data: null,
    received: false,
  };

  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      return url.includes('/rest/v1/categories') && 
             response.request().method() === 'GET';
    },
    { timeout }
  );

  result.received = true;
  result.status = response.status();
  result.url = response.url();
  result.method = response.request().method();

  // Parse query parameters
  const urlObj = new URL(response.url());
  urlObj.searchParams.forEach((value, key) => {
    result.queryParams[key] = value;
  });

  // Parse response data
  try {
    result.data = await response.json();
  } catch (e) {
    result.data = null;
  }

  return result;
}

/**
 * Verify product content matches search term
 * 
 * @param page - Playwright Page object
 * @param searchTerm - Search term to verify
 * @param sampleSize - Number of products to sample (default: 3)
 * @returns Whether all sampled products match the search term
 */
export async function verifyProductContentMatchesSearch(
  page: Page,
  searchTerm: string,
  sampleSize: number = 3
): Promise<boolean> {
  const productCards = page.locator('[data-testid^="catalog-product-card"]');
  const cardCount = await productCards.count();

  if (cardCount === 0) {
    return false; // No products to verify
  }

  const actualSampleSize = Math.min(sampleSize, cardCount);
  const searchTermLower = searchTerm.toLowerCase();

  let matchesFound = 0;
  for (let i = 0; i < actualSampleSize; i++) {
    const card = productCards.nth(i);
    const cardText = await card.textContent();
    const cardTextLower = cardText?.toLowerCase() || '';

    // Try to find product title specifically (usually in h3, h4, or strong tag)
    const titleElement = card.locator('h3, h4, strong, [class*="title"], [class*="name"]').first();
    let titleText = '';
    if (await titleElement.count() > 0) {
      titleText = (await titleElement.textContent() || '').toLowerCase();
    }

    // Check if search term appears in product title or card text
    const matchesInTitle = titleText.includes(searchTermLower);
    const matchesInCard = cardTextLower.includes(searchTermLower);
    
    if (matchesInTitle || matchesInCard) {
      matchesFound++;
    } else {
      console.warn(`⚠️ Product ${i + 1} does not contain search term "${searchTerm}": ${cardText?.substring(0, 50)}...`);
    }
  }

  // At least 50% of sampled products should match, or at least 1 if sample size is small
  const minMatches = Math.max(1, Math.ceil(actualSampleSize * 0.5));
  const result = matchesFound >= minMatches;
  
  if (!result) {
    console.warn(`⚠️ Only ${matchesFound}/${actualSampleSize} products matched search term "${searchTerm}" (expected at least ${minMatches})`);
  }
  
  return result;
}

/**
 * Verify API response structure for products
 * 
 * @param apiResult - API verification result
 * @returns Whether the response structure is valid
 */
export function verifyProductsApiResponse(apiResult: ApiVerificationResult): boolean {
  if (!apiResult.received) {
    console.error('❌ API call was not received');
    return false;
  }

  if (apiResult.status !== 200) {
    console.error(`❌ API call returned status ${apiResult.status}, expected 200`);
    return false;
  }

  if (!Array.isArray(apiResult.data)) {
    console.error('❌ API response is not an array');
    return false;
  }

  // Verify products have required fields
  if (apiResult.data.length > 0) {
    const firstProduct = apiResult.data[0];
    const requiredFields = ['id', 'title', 'price'];
    for (const field of requiredFields) {
      if (!(field in firstProduct)) {
        console.error(`❌ Product missing required field: ${field}`);
        return false;
      }
    }
  }

  return true;
}
