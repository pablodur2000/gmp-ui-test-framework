/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities
 */

// Step Executor (currently unused - consider removing)
export { step, steps, stepGroup, extractStepsForDocumentation } from './step-executor';
export type { StepOptions, StepResult } from './step-executor';

// Navigation Helpers
export {
  BASE_URL,
  navigateToHome,
  navigateToCatalog,
  navigateToProduct,
  navigateToAdminLogin,
  navigateToAdminDashboard,
  buildUrl,
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
