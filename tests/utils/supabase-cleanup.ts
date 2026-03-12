/**
 * Supabase Cleanup Utility
 * 
 * Provides functions to clean up test data created during test execution.
 * Uses direct Supabase API calls to delete resources created in tests.
 * 
 * Usage:
 * ```typescript
 * import { cleanupTestProduct } from '../utils/supabase-cleanup';
 * 
 * test.afterEach(async () => {
 *   if (createdProductId) {
 *     await cleanupTestProduct(createdProductId);
 *   }
 * });
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Get Supabase client for cleanup operations
 * Creates client lazily to avoid errors if env vars aren't set
 * Detects environment from BASE_URL and uses matching Supabase credentials
 * Authenticates as admin user if using anon key (same as web app)
 * Returns null if credentials aren't available (cleanup will be skipped)
 */
async function getSupabaseClient() {
  // Detect environment from BASE_URL
  const baseUrl = process.env.BASE_URL || '';
  const isProduction = baseUrl.includes('gmp-web-app.vercel.app') || baseUrl.includes('production');
  const isDevelopment = baseUrl.includes('pablodur2000.github.io') || baseUrl.includes('develop') || baseUrl.includes('localhost');

  // Select credentials based on environment
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  let supabaseServiceRoleKey = '';

  if (isProduction) {
    // Production credentials
    supabaseUrl = process.env.VITE_SUPABASE_URL_PROD || process.env.SUPABASE_URL_PROD || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY_PROD || process.env.SUPABASE_ANON_KEY_PROD || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  } else if (isDevelopment) {
    // Development/Staging credentials
    // IMPORTANT: For localhost, prioritize base VITE_SUPABASE_URL to match web app's project
    // The web app uses VITE_SUPABASE_URL (no suffix), so we use that first
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL_DEV || process.env.SUPABASE_URL_DEV || '';
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY_DEV || process.env.SUPABASE_ANON_KEY_DEV || '';
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || '';
  } else {
    // Default/fallback credentials
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRoleKey)) {
    return null; // Return null instead of throwing - cleanup will be skipped gracefully
  }

  // Use anon key (same as web app)
  // We'll authenticate as admin user to make RLS work
  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;
  const keyType = supabaseServiceRoleKey ? 'SERVICE_ROLE' : 'ANON';
  
  console.log(`🔑 Cleanup using Supabase ${keyType} key`);
  console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

  const client = createClient(
    supabaseUrl,
    keyToUse,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // If using anon key, authenticate as admin user (same as web app does)
  if (!supabaseServiceRoleKey && supabaseAnonKey) {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (error) {
          console.warn(`⚠️ Failed to authenticate as admin for cleanup: ${error.message}`);
          console.warn(`⚠️ Cleanup may fail due to RLS policies`);
        } else {
          console.log(`✅ Authenticated as admin for cleanup`);
        }
      } catch (e: any) {
        console.warn(`⚠️ Error authenticating for cleanup: ${e.message}`);
      }
    } else {
      console.warn(`⚠️ TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD not set - cleanup may fail due to RLS`);
    }
  }

  return client;
}

/**
 * Cleanup result interface
 */
export interface CleanupResult {
  success: boolean;
  error?: string;
  resourceType: string;
  resourceId: string;
}

export interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

/**
 * Create a test product with a TEST_DELETE_ prefix for isolated testing
 * @param productData - Product data to create
 * @returns Create result with product ID
 */
export async function createTestProduct(productData: {
  title: string;
  description: string;
  short_description: string;
  price: number;
  available: boolean;
  featured: boolean;
  inventory_status: 'disponible_pieza_unica' | 'disponible_encargo_mismo_material' | 'disponible_encargo_diferente_material' | 'no_disponible';
  images?: string[];
  category_id?: string;
}): Promise<CreateProductResult> {
  try {
    // Ensure title has a TEST_ prefix for safety (check for any TEST_ prefix, not just TEST_DELETE_)
    const hasTestPrefix = productData.title.startsWith('TEST_');
    const safeTitle = hasTestPrefix 
      ? productData.title 
      : `TEST_DELETE_${productData.title}`;

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase credentials not configured'
      };
    }

    // Get first available category if category_id not provided
    let categoryId = productData.category_id;
    if (!categoryId) {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id')
        .limit(1)
        .single();
      
      if (catError || !categories) {
        console.warn('⚠️ No categories found, creating product without category');
      } else {
        categoryId = categories.id;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        title: safeTitle,
        description: productData.description,
        short_description: productData.short_description,
        price: productData.price,
        available: productData.available,
        featured: productData.featured,
        inventory_status: productData.inventory_status,
        images: productData.images || [],
        category_id: categoryId || null
      })
      .select('id')
      .single();

    if (error) {
      console.error(`❌ Failed to create test product: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data || !data.id) {
      return {
        success: false,
        error: 'Product created but no ID returned'
      };
    }

    console.log(`✅ Created test product: ${safeTitle} (${data.id})`);
    return {
      success: true,
      productId: data.id
    };
  } catch (error: any) {
    console.error(`❌ Error creating test product: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a product by ID
 * @param productId - Product ID to delete
 * @returns Cleanup result
 */
export async function cleanupTestProduct(productId: string): Promise<CleanupResult> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required',
        resourceType: 'product',
        resourceId: productId || 'unknown'
      };
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn(`⚠️ Skipping cleanup for product ${productId}: Supabase credentials not configured in .env file`);
      return {
        success: false,
        error: 'Supabase credentials not configured',
        resourceType: 'product',
        resourceId: productId
      };
    }

    // Log which Supabase project is being used
    const supabaseUrl = process.env.BASE_URL || '';
    const isProduction = supabaseUrl.includes('gmp-web-app.vercel.app') || supabaseUrl.includes('production');
    const isDevelopment = supabaseUrl.includes('pablodur2000.github.io') || supabaseUrl.includes('develop') || supabaseUrl.includes('localhost');
    const envType = isProduction ? 'PROD' : isDevelopment ? 'DEV' : 'DEFAULT';
    console.log(`🔍 Cleanup using Supabase ${envType} credentials`);

    // Try to delete and verify it was actually deleted
    const { data: beforeDelete } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!beforeDelete) {
      console.log(`ℹ️ Product ${productId} not found (may have been already deleted)`);
      return {
        success: true,
        resourceType: 'product',
        resourceId: productId
      };
    }

    const { error, data } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .select();

    if (error) {
      console.error(`❌ Failed to delete product ${productId}: ${error.message}`);
      console.error(`❌ Error details:`, error);
      return {
        success: false,
        error: error.message,
        resourceType: 'product',
        resourceId: productId
      };
    }

    // Verify deletion by checking if product still exists
    const { data: afterDelete } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (afterDelete) {
      console.error(`❌ Product ${productId} still exists after delete attempt!`);
      console.error(`❌ This may indicate RLS policy blocking deletion or wrong Supabase project`);
      return {
        success: false,
        error: 'Product still exists after delete - check RLS policies or Supabase project mismatch',
        resourceType: 'product',
        resourceId: productId
      };
    }

    console.log(`✅ Cleaned up test product: ${productId} (verified deleted)`);
    return {
      success: true,
      resourceType: 'product',
      resourceId: productId
    };
  } catch (error: any) {
    console.warn(`⚠️ Error cleaning up product ${productId}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      resourceType: 'product',
      resourceId: productId
    };
  }
}

/**
 * Delete a category by ID
 * @param categoryId - Category ID to delete
 * @returns Cleanup result
 */
export async function cleanupTestCategory(categoryId: string): Promise<CleanupResult> {
  try {
    if (!categoryId) {
      return {
        success: false,
        error: 'Category ID is required',
        resourceType: 'category',
        resourceId: categoryId || 'unknown'
      };
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn(`⚠️ Skipping cleanup for category ${categoryId}: Supabase credentials not configured in .env file`);
      return {
        success: false,
        error: 'Supabase credentials not configured',
        resourceType: 'category',
        resourceId: categoryId
      };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.warn(`⚠️ Failed to delete category ${categoryId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resourceType: 'category',
        resourceId: categoryId
      };
    }

    console.log(`✅ Cleaned up test category: ${categoryId}`);
    return {
      success: true,
      resourceType: 'category',
      resourceId: categoryId
    };
  } catch (error: any) {
    console.warn(`⚠️ Error cleaning up category ${categoryId}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      resourceType: 'category',
      resourceId: categoryId
    };
  }
}

/**
 * Delete a sale by ID
 * @param saleId - Sale ID to delete
 * @returns Cleanup result
 */
export async function cleanupTestSale(saleId: string): Promise<CleanupResult> {
  try {
    if (!saleId) {
      return {
        success: false,
        error: 'Sale ID is required',
        resourceType: 'sale',
        resourceId: saleId || 'unknown'
      };
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn(`⚠️ Skipping cleanup for sale ${saleId}: Supabase credentials not configured in .env file`);
      return {
        success: false,
        error: 'Supabase credentials not configured',
        resourceType: 'sale',
        resourceId: saleId
      };
    }
    
    // First delete sale items (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId);

    if (itemsError) {
      console.warn(`⚠️ Failed to delete sale items for sale ${saleId}: ${itemsError.message}`);
    }

    // Then delete the sale
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      console.warn(`⚠️ Failed to delete sale ${saleId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resourceType: 'sale',
        resourceId: saleId
      };
    }

    console.log(`✅ Cleaned up test sale: ${saleId}`);
    return {
      success: true,
      resourceType: 'sale',
      resourceId: saleId
    };
  } catch (error: any) {
    console.warn(`⚠️ Error cleaning up sale ${saleId}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      resourceType: 'sale',
      resourceId: saleId
    };
  }
}

/**
 * Delete an activity log by ID
 * @param activityLogId - Activity log ID to delete
 * @returns Cleanup result
 */
export async function cleanupTestActivityLog(activityLogId: string): Promise<CleanupResult> {
  try {
    if (!activityLogId) {
      return {
        success: false,
        error: 'Activity log ID is required',
        resourceType: 'activity_log',
        resourceId: activityLogId || 'unknown'
      };
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn(`⚠️ Skipping cleanup for activity log ${activityLogId}: Supabase credentials not configured in .env file`);
      return {
        success: false,
        error: 'Supabase credentials not configured',
        resourceType: 'activity_log',
        resourceId: activityLogId
      };
    }

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('id', activityLogId);

    if (error) {
      console.warn(`⚠️ Failed to delete activity log ${activityLogId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resourceType: 'activity_log',
        resourceId: activityLogId
      };
    }

    console.log(`✅ Cleaned up test activity log: ${activityLogId}`);
    return {
      success: true,
      resourceType: 'activity_log',
      resourceId: activityLogId
    };
  } catch (error: any) {
    console.warn(`⚠️ Error cleaning up activity log ${activityLogId}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      resourceType: 'activity_log',
      resourceId: activityLogId
    };
  }
}

/**
 * Delete multiple products by IDs
 * @param productIds - Array of product IDs to delete
 * @returns Array of cleanup results
 */
export async function cleanupTestProducts(productIds: string[]): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];
  for (const productId of productIds) {
    const result = await cleanupTestProduct(productId);
    results.push(result);
  }
  return results;
}

/**
 * Cleanup helper that tracks resources created during a test
 * Use this in test.afterEach to automatically clean up all tracked resources
 */
export class TestCleanupTracker {
  private products: string[] = [];
  private categories: string[] = [];
  private sales: string[] = [];
  private activityLogs: string[] = [];

  /**
   * Track a product ID for cleanup
   */
  trackProduct(productId: string): void {
    if (productId && !this.products.includes(productId)) {
      this.products.push(productId);
    }
  }

  /**
   * Track a category ID for cleanup
   */
  trackCategory(categoryId: string): void {
    if (categoryId && !this.categories.includes(categoryId)) {
      this.categories.push(categoryId);
    }
  }

  /**
   * Track a sale ID for cleanup
   */
  trackSale(saleId: string): void {
    if (saleId && !this.sales.includes(saleId)) {
      this.sales.push(saleId);
    }
  }

  /**
   * Track an activity log ID for cleanup
   */
  trackActivityLog(activityLogId: string): void {
    if (activityLogId && !this.activityLogs.includes(activityLogId)) {
      this.activityLogs.push(activityLogId);
    }
  }

  /**
   * Clean up all tracked resources
   * Resources are cleaned up in reverse dependency order:
   * 1. Sales (depends on products)
   * 2. Products (may have images in storage)
   * 3. Categories (may be referenced by products)
   * 4. Activity logs (independent)
   */
  async cleanupAll(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    // Clean up in reverse dependency order
    // 1. Sales first (they reference products)
    for (const saleId of this.sales) {
      const result = await cleanupTestSale(saleId);
      results.push(result);
    }

    // 2. Products (they may reference categories and have images)
    for (const productId of this.products) {
      const result = await cleanupTestProduct(productId);
      results.push(result);
    }

    // 3. Categories (products may reference them, but we already deleted products)
    for (const categoryId of this.categories) {
      const result = await cleanupTestCategory(categoryId);
      results.push(result);
    }

    // 4. Activity logs (independent)
    for (const activityLogId of this.activityLogs) {
      const result = await cleanupTestActivityLog(activityLogId);
      results.push(result);
    }

    // Clear tracked resources
    this.products = [];
    this.categories = [];
    this.sales = [];
    this.activityLogs = [];

    return results;
  }

  /**
   * Get count of tracked resources
   */
  getTrackedCount(): { products: number; categories: number; sales: number; activityLogs: number } {
    return {
      products: this.products.length,
      categories: this.categories.length,
      sales: this.sales.length,
      activityLogs: this.activityLogs.length
    };
  }
}
