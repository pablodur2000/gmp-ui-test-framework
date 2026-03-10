/**
 * Test Selectors Utility
 * 
 * Centralized selectors using data-testid attributes.
 * This provides a single source of truth for all test selectors
 * and makes it easy to update selectors if data-testid values change.
 * 
 * Usage:
 *   import { TestSelectors } from '../utils/selectors';
 *   const header = page.locator(TestSelectors.header);
 */

/**
 * Test selectors organized by component/page
 * 
 * Note: Some selectors may not exist yet in the application.
 * Add data-testid attributes to the application as needed.
 */
export const TestSelectors = {
  // ============================================
  // Layout & Common Elements
  // ============================================
  mainContent: '[data-testid="main-content"]',
  
  // ============================================
  // Header & Navigation
  // ============================================
  header: '[data-testid="header"]',
  headerLogo: '[data-testid="header-logo"]',
  headerNav: '[data-testid="header-nav"]',
  headerNavHomeLink: '[data-testid="header-nav-home-link"]',
  headerNavCatalogLink: '[data-testid="header-nav-catalog-link"]',
  headerMobileMenuButton: '[data-testid="header-mobile-menu-button"]',
  
  // ============================================
  // Footer
  // ============================================
  footer: '[data-testid="footer"]',
  
  // ============================================
  // Home Page
  // ============================================
  homeHeroSection: '[data-testid="home-hero-section"]',
  homeHeroCtaButton: '[data-testid="home-hero-cta-button"]',
  homeHeroFirstVisitLogo: '[data-testid="home-hero-first-visit-logo"]',
  homeHeroFirstVisitCurtain: '[data-testid="home-hero-first-visit-curtain"]',
  homeHeroSlide: (index: number) => `[data-testid="home-hero-slide-${index}"]`,
  homeHeroSlideOverlay: (index: number) => `[data-testid="home-hero-slide-overlay-${index}"]`,
  homeHeroContent: '[data-testid="home-hero-content"]',
  homeHeroTitle: '[data-testid="home-hero-title"]',
  homeHeroSubtitle: '[data-testid="home-hero-subtitle"]',
  homeHeroDescription: '[data-testid="home-hero-description"]',
  homeHeroCtaArrowIcon: '[data-testid="home-hero-cta-arrow-icon"]',
  
  // Location Section
  homeLocationSection: '[data-testid="home-location-section"]',
  homeLocationHeading: '[data-testid="home-location-heading"]',
  homeLocationInfoCardTiendaFisica: '[data-testid="home-location-info-card-tienda-fisica"]',
  homeLocationInfoCardEnvios: '[data-testid="home-location-info-card-envios"]',
  homeLocationInfoCardGarantia: '[data-testid="home-location-info-card-garantia"]',
  homeLocationAddressCard: '[data-testid="home-location-address-card"]',
  homeLocationAddressText: '[data-testid="home-location-address-text"]',
  homeLocationMapAddress: '[data-testid="home-location-map-address"]',
  homeLocationVerMapaButton: '[data-testid="home-location-ver-mapa-button"]',
  homeLocationRastrearEnvioLink: '[data-testid="home-location-rastrear-envio-link"]',
  
  // Featured Products Section
  homeFeaturedProducts: '[data-testid="home-featured-products"]',
  homeFeaturedProductsHeading: '[data-testid="home-featured-products-heading"]',
  homeFeaturedProductCard: (index: number) => `[data-testid="home-featured-product-card-${index}"]`,
  homeFeaturedProductsVerTodosLink: '[data-testid="home-featured-products-ver-todos-link"]',
  
  // About GMP Section
  homeAboutGmpSection: '[data-testid="home-about-gmp-section"]',
  homeAboutGmpHeading: '[data-testid="home-about-gmp-heading"]',
  homeAboutGmpDescription: '[data-testid="home-about-gmp-description"]',
  homeAboutGmpArtisanName: '[data-testid="home-about-gmp-artisan-name"]',
  homeAboutGmpArtisanImage: '[data-testid="home-about-gmp-artisan-image"]',
  homeAboutGmpImageContainer: '[data-testid="home-about-gmp-image-container"]',
  homeAboutGmpSkillsContainer: '[data-testid="home-about-gmp-skills-container"]',
  homeAboutGmpSkillMarroquineria: '[data-testid="home-about-gmp-skill-marroquineria"]',
  homeAboutGmpSkillMacrame: '[data-testid="home-about-gmp-skill-macrame"]',
  
  // CTA Section
  homeCtaSection: '[data-testid="home-cta-section"]',
  homeCtaCatalogLink: '[data-testid="home-cta-catalog-link"]',
  
  // ============================================
  // Catalog Page
  // ============================================
  catalogPage: '[data-testid="catalog-page"]',
  catalogHeading: '[data-testid="catalog-heading"]',
  catalogFilters: '[data-testid="catalog-filters"]',
  catalogSearchInput: '[data-testid="catalog-search-input"]',
  // Main Category Filter Buttons (in main content area)
  catalogMainCategoryAll: '[data-testid="catalog-main-category-all"]',
  catalogMainCategoryCuero: '[data-testid="catalog-main-category-cuero"]',
  catalogMainCategoryMacrame: '[data-testid="catalog-main-category-macrame"]',
  // Subcategory Filter (in sidebar)
  catalogSubcategoryFilterAll: '[data-testid="catalog-subcategory-filter-all"]',
  catalogSubcategoryFilter: (categoryName: string) => `[data-testid="catalog-subcategory-filter-${categoryName}"]`,
  catalogCategoryFilter: (category: string) => `[data-testid="catalog-category-filter-${category}"]`,
  catalogInventoryFilter: (status: string) => `[data-testid="catalog-inventory-filter-${status}"]`,
  catalogProductList: '[data-testid="catalog-product-list"]',
  catalogProductCard: (id: string | number) => `[data-testid="catalog-product-card-${id}"]`,
  catalogProductCount: '[data-testid="catalog-product-count"]',
  catalogEmptyState: '[data-testid="catalog-empty-state"]',
  catalogViewToggle: '[data-testid="catalog-view-toggle"]',
  catalogViewToggleGrid: '[data-testid="catalog-view-toggle-grid"]',
  catalogViewToggleList: '[data-testid="catalog-view-toggle-list"]',
  
  // ============================================
  // Product Detail Page
  // ============================================
  productDetailPage: '[data-testid="product-detail-page"]',
  productDetailTitle: '[data-testid="product-detail-title"]',
  productDetailPrice: '[data-testid="product-detail-price"]',
  productDetailDescription: '[data-testid="product-detail-description"]',
  productDetailImageGallery: '[data-testid="product-detail-image-gallery"]',
  productDetailImage: (index: number) => `[data-testid="product-detail-image-${index}"]`,
  productDetailInventoryStatus: '[data-testid="product-detail-inventory-status"]',
  productDetailRelatedProducts: '[data-testid="product-detail-related-products"]',
  productDetailBreadcrumb: '[data-testid="product-detail-breadcrumb"]',
  productDetailBreadcrumbInicio: '[data-testid="product-detail-breadcrumb-inicio"]',
  productDetailBreadcrumbCatalogo: '[data-testid="product-detail-breadcrumb-catalogo"]',
  productDetailBreadcrumbCurrent: '[data-testid="product-detail-breadcrumb-current"]',
  
  // ============================================
  // Admin Pages
  // ============================================
  adminLoginPage: '[data-testid="admin-login-page"]',
  adminLoginEmailInput: '[data-testid="admin-login-email-input"]',
  adminLoginPasswordInput: '[data-testid="admin-login-password-input"]',
  adminLoginPasswordToggleButton: '[data-testid="admin-login-password-toggle-button"]',
  adminLoginSubmitButton: '[data-testid="admin-login-submit-button"]',
  adminLoginErrorMessage: '[data-testid="admin-login-error-message"]',
  
  adminDashboardPage: '[data-testid="admin-dashboard-page"]',
  adminAddProductButton: '[data-testid="admin-add-product-button"]',
  adminProductFormModal: '[data-testid="admin-product-form-modal"]',
  adminProductFormModalTitle: '[data-testid="admin-product-form-modal-title"]',
  adminProductFormModalCloseButton: '[data-testid="admin-product-form-modal-close-button"]',
  adminProductForm: '[data-testid="admin-product-form"]',
  adminProductFormTitleInput: '[data-testid="admin-product-form-title-input"]',
  adminProductFormDescriptionInput: '[data-testid="admin-product-form-description-input"]',
  adminProductFormShortDescriptionInput: '[data-testid="admin-product-form-short-description-input"]',
  adminProductFormFeaturesInput: '[data-testid="admin-product-form-features-input"]',
  adminProductFormPriceInput: '[data-testid="admin-product-form-price-input"]',
  adminProductFormCategorySelect: '[data-testid="admin-product-form-category-select"]',
  adminProductFormAvailableCheckbox: '[data-testid="admin-product-form-available-checkbox"]',
  adminProductFormFeaturedCheckbox: '[data-testid="admin-product-form-featured-checkbox"]',
  adminProductFormInventoryStatusSelect: '[data-testid="admin-product-form-inventory-status-select"]',
  adminProductFormImageUploadInput: '[data-testid="admin-product-form-image-upload-input"]',
  adminProductFormSubmitButton: '[data-testid="admin-product-form-submit-button"]',
  adminProductList: '[data-testid="admin-product-list"]',
  adminProductCard: (id: string | number) => `[data-testid="admin-product-card-${id}"]`,
  adminManageProductsButton: '[data-testid="admin-manage-products-button"]',
  adminEditProductButton: (id: string | number) => `[data-testid="admin-edit-product-button-${id}"]`,
  adminDeleteProductButton: (id: string | number) => `[data-testid="admin-delete-product-button-${id}"]`,
  adminProductEditModal: '[data-testid="admin-product-edit-modal"]',
  adminProductEditModalTitle: '[data-testid="admin-product-edit-modal-title"]',
  adminProductEditModalCloseButton: '[data-testid="admin-product-edit-modal-close-button"]',
  adminProductEditForm: '[data-testid="admin-product-edit-form"]',
  adminProductEditFormTitleInput: '[data-testid="admin-product-edit-form-title-input"]',
  adminProductEditFormSubmitButton: '[data-testid="admin-product-edit-form-submit-button"]',
} as const;

/**
 * Helper function to create a selector with fallback
 * 
 * @param primarySelector - The data-testid selector (preferred)
 * @param fallbackSelector - Fallback selector if data-testid doesn't exist yet
 * @returns A Playwright locator string or object
 * 
 * @example
 *   // Use data-testid if available, fallback to role
 *   const link = page.locator(
 *     withFallback(TestSelectors.headerNavCatalogLink, 'link[name=/catálogo/i]')
 *   );
 */
export function withFallback(
  primarySelector: string,
  fallbackSelector: string
): string {
  // For now, return primary selector
  // In the future, we can implement logic to check if primary exists
  return primarySelector;
}

/**
 * Get a selector with a dynamic value
 * 
 * @param selectorFn - Function that generates selector
 * @param value - Value to pass to the function
 * @returns The generated selector string
 * 
 * @example
 *   const cardSelector = getSelector(TestSelectors.catalogProductCard, '123');
 *   // Returns: '[data-testid="catalog-product-card-123"]'
 */
export function getSelector<T extends string | number>(
  selectorFn: (value: T) => string,
  value: T
): string {
  return selectorFn(value);
}

