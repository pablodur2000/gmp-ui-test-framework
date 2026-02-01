import { Page, Locator } from '@playwright/test';

/**
 * Image Verification Utility
 * 
 * Provides utilities to verify that images load correctly on a page.
 * 
 * Usage:
 * ```typescript
 * await verifyImagesLoad(page);
 * ```
 */

/**
 * Verify that images on the page load successfully
 * 
 * Checks up to a specified number of images to ensure they return
 * valid HTTP responses (status < 400).
 * 
 * @param page - Playwright Page object
 * @param maxImages - Maximum number of images to check (default: 5)
 * @param throwOnFailure - Whether to throw error on image load failure (default: false)
 * @returns Object with verification results
 * 
 * @example
 * ```typescript
 * const result = await verifyImagesLoad(page, 10);
 * console.log(`Verified ${result.verified} of ${result.total} images`);
 * ```
 */
export async function verifyImagesLoad(
  page: Page,
  maxImages: number = 5,
  throwOnFailure: boolean = false
): Promise<{ verified: number; total: number; failed: number }> {
  const allImages = page.locator('img');
  const imageCount = await allImages.count();
  
  if (imageCount === 0) {
    return { verified: 0, total: 0, failed: 0 };
  }

  let verified = 0;
  let failed = 0;
  const imagesToCheck = Math.min(imageCount, maxImages);

  for (let i = 0; i < imagesToCheck; i++) {
    const img = allImages.nth(i);
    const src = await img.getAttribute('src');
    
    if (!src || src.startsWith('data:')) {
      // Skip data URIs (they're inline, no HTTP request needed)
      verified++;
      continue;
    }

    try {
      // Build full URL for relative paths
      let fullUrl: string;
      
      if (src.startsWith('http')) {
        // Absolute URL
        fullUrl = src;
      } else {
        // Relative URL - build full URL
        const baseURL = page.url().split('/').slice(0, 3).join('/');
        fullUrl = src.startsWith('/') 
          ? `${baseURL}${src}` 
          : `${baseURL}/${src}`;
      }

      // Verify image loads
      const response = await page.request.get(fullUrl);
      
      if (response.status() < 400) {
        verified++;
      } else {
        failed++;
        if (throwOnFailure) {
          throw new Error(
            `Image failed to load: ${fullUrl} (status: ${response.status()})`
          );
        }
      }
    } catch (e) {
      failed++;
      if (throwOnFailure) {
        throw new Error(`Error verifying image: ${src} - ${e}`);
      }
      // Continue checking other images
    }
  }

  if (verified > 0 && failed === 0) {
    console.log(`✅ Verified ${verified} images load successfully`);
  } else if (failed > 0) {
    console.warn(`⚠️ ${failed} of ${imagesToCheck} images failed to load`);
  }

  return { verified, total: imagesToCheck, failed };
}

/**
 * Verify a specific image loads
 * 
 * @param page - Playwright Page object
 * @param imageLocator - Locator for the specific image
 * @param throwOnFailure - Whether to throw error on failure (default: true)
 * 
 * @example
 * ```typescript
 * const productImage = page.locator('[data-testid="product-image"]');
 * await verifyImageLoads(page, productImage);
 * ```
 */
export async function verifyImageLoads(
  page: Page,
  imageLocator: Locator,
  throwOnFailure: boolean = true
): Promise<boolean> {
  const src = await imageLocator.getAttribute('src');
  
  if (!src) {
    if (throwOnFailure) {
      throw new Error('Image has no src attribute');
    }
    return false;
  }

  if (src.startsWith('data:')) {
    // Data URI - no HTTP request needed
    return true;
  }

  try {
    // Build full URL
    let fullUrl: string;
    
    if (src.startsWith('http')) {
      fullUrl = src;
    } else {
      const baseURL = page.url().split('/').slice(0, 3).join('/');
      fullUrl = src.startsWith('/') 
        ? `${baseURL}${src}` 
        : `${baseURL}/${src}`;
    }

    const response = await page.request.get(fullUrl);
    const success = response.status() < 400;
    
    if (!success && throwOnFailure) {
      throw new Error(
        `Image failed to load: ${fullUrl} (status: ${response.status()})`
      );
    }
    
    return success;
  } catch (e) {
    if (throwOnFailure) {
      throw new Error(`Error verifying image: ${src} - ${e}`);
    }
    return false;
  }
}
