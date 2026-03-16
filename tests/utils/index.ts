/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities
 */

// Navigation Helpers
export {
  BASE_URL,
  navigateToHome,
  navigateToCatalog,
  navigateToProduct,
  navigateToAdminLogin,
  navigateToAdminDashboard,
  buildUrl,
  expectPathname,
} from './navigation';

// Selectors
export {
  TestSelectors,
  withFallback,
  getSelector,
} from './selectors';

// Console Monitoring
export {
  monitorConsoleErrors,
  checkCriticalErrors,
  monitorAndCheckConsoleErrors,
} from './console-monitor';

// Performance Tracking
export {
  trackPageLoad,
  trackRedirect,
} from './performance-tracker';

// API Listener
export {
  setupSupabaseListener,
  waitForApiResponse,
} from './api-listener';
export type { ApiListenerFilters, ApiResponse } from './api-listener';

// API Verification (Enhanced)
export {
  waitForProductsApiCall,
  waitForSearchApiCall,
  waitForCategoriesApiCall,
  verifyProductContentMatchesSearch,
  verifyProductsApiResponse,
} from './api-verification';
export type { ApiVerificationResult, ProductsApiFilters } from './api-verification';

// Image Verification
export {
  verifyImagesLoad,
  verifyImageLoads,
} from './image-verification';

// Wait Helpers
export {
  waitForScrollToComplete,
  waitForAnimationComplete,
  waitForFirstVisitAnimation,
  waitForElementInViewport,
  waitForHoverEffect,
} from './wait-helpers';

// Catalog Helpers
export {
  extractProductCount,
  waitForCountUpdate,
  waitForSearchComplete,
} from './catalog-helpers';

// Supabase Cleanup
export {
  cleanupTestProduct,
  cleanupTestCategory,
  createTestSale,
  cleanupTestSale,
  createTestActivityLog,
  cleanupTestActivityLog,
  cleanupTestProducts,
  TestCleanupTracker,
  type CleanupResult,
  type CreateSaleResult,
  type CreateActivityLogResult,
} from './supabase-cleanup';
