import { Page, Response } from '@playwright/test';

/**
 * API Listener Utility
 * 
 * Provides utilities to listen for and verify API responses, particularly
 * Supabase API calls.
 * 
 * Usage:
 * ```typescript
 * const response = await setupSupabaseListener(page, {
 *   endpoint: 'products',
 *   queryParams: { featured: 'eq.true' }
 * });
 * expect(response.status).toBe(200);
 * ```
 */

/**
 * Configuration for API listener filters
 */
export interface ApiListenerFilters {
  /** API endpoint to match (e.g., 'products', 'users') */
  endpoint?: string;
  /** Query parameters to match (e.g., { featured: 'eq.true' }) */
  queryParams?: Record<string, string>;
  /** Full URL pattern to match (regex or string) */
  urlPattern?: string | RegExp;
}

/**
 * API response data captured by listener
 */
export interface ApiResponse {
  /** Whether a matching response was received */
  received: boolean;
  /** HTTP status code */
  status: number;
  /** Response data (parsed JSON if available) */
  data: any;
  /** Full URL of the response */
  url: string;
}

/**
 * Setup a listener for Supabase API responses
 * 
 * @param page - Playwright Page object
 * @param filters - Filters to match specific API calls
 * @param timeout - Maximum time to wait for response (default: 5000ms)
 * @returns Promise that resolves with API response data
 * 
 * @example
 * ```typescript
 * // Listen for featured products API call
 * const response = await setupSupabaseListener(page, {
 *   endpoint: 'products',
 *   queryParams: { featured: 'eq.true' }
 * });
 * 
 * expect(response.received).toBe(true);
 * expect(response.status).toBe(200);
 * expect(Array.isArray(response.data)).toBe(true);
 * ```
 */
export async function setupSupabaseListener(
  page: Page,
  filters: ApiListenerFilters = {},
  timeout: number = 5000
): Promise<ApiResponse> {
  const responseData: ApiResponse = {
    received: false,
    status: 0,
    data: null,
    url: '',
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (!responseData.received) {
        resolve(responseData); // Return empty response if timeout
      }
    }, timeout);

    const responseHandler = async (response: Response) => {
      const url = response.url();
      
      // Check if this is a Supabase API call
      if (!url.includes('/rest/v1/') && !url.includes('supabase')) {
        return;
      }

      let matches = true;

      // Check endpoint filter
      if (filters.endpoint && !url.includes(filters.endpoint)) {
        matches = false;
      }

      // Check query parameter filters
      if (filters.queryParams) {
        for (const [key, value] of Object.entries(filters.queryParams)) {
          if (!url.includes(`${key}=${value}`)) {
            matches = false;
            break;
          }
        }
      }

      // Check URL pattern filter
      if (filters.urlPattern) {
        const pattern = filters.urlPattern instanceof RegExp
          ? filters.urlPattern
          : new RegExp(filters.urlPattern);
        if (!pattern.test(url)) {
          matches = false;
        }
      }

      if (matches) {
        responseData.received = true;
        responseData.status = response.status();
        responseData.url = url;
        
        try {
          responseData.data = await response.json();
        } catch (e) {
          // Response might not be JSON, that's okay
          responseData.data = null;
        }

        clearTimeout(timeoutId);
        page.off('response', responseHandler);
        resolve(responseData);
      }
    };

    page.on('response', responseHandler);
  });
}

/**
 * Wait for a specific API response using Playwright's built-in waitForResponse
 * 
 * This is a simpler alternative to setupSupabaseListener for cases where
 * you just need to wait for a response without complex filtering.
 * 
 * @param page - Playwright Page object
 * @param urlPattern - URL pattern to match (string or RegExp)
 * @param timeout - Maximum time to wait (default: 5000ms)
 * @returns The response object
 * 
 * @example
 * ```typescript
 * const response = await waitForApiResponse(
 *   page,
 *   /\/rest\/v1\/products.*featured=eq\.true/
 * );
 * expect(response.status()).toBe(200);
 * ```
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 5000
): Promise<Response> {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const pattern = urlPattern instanceof RegExp
        ? urlPattern
        : new RegExp(urlPattern);
      return pattern.test(url);
    },
    { timeout }
  );
}
