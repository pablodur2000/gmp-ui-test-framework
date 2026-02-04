# Catalog Page - Data-TestID Analysis & Recommendations

**Generated:** January 2026  
**Purpose:** Identify missing `data-testid` attributes to prevent strict mode violations and improve test stability

---

## 🔍 Issue Analysis

### Problem: Strict Mode Violation

**Error Location:** `catalog-page-loads-and-displays-all-products.spec.ts:97`

**Root Cause:** Two buttons with similar text "Todas" exist:
1. **Main Category Filter** (CatalogPage.tsx): `data-testid="catalog-main-category-all"` ✅
2. **Subcategory Filter** (CategoryFilter.tsx): No `data-testid` ❌

**Impact:** Fallback selector matches both buttons, causing strict mode violation.

---

## ✅ Current Data-TestID Coverage

### CatalogPage.tsx (Main Content Area)

| Element | data-testid | Status | Location |
|---------|-------------|--------|----------|
| Page container | `catalog-page` | ✅ Exists | Line 360 |
| Heading | `catalog-heading` | ✅ Exists | Line 362 |
| Main category "Todas" button | `catalog-main-category-all` | ✅ Exists | Line 404 |
| Main category "Cuero" button | `catalog-main-category-cuero` | ✅ Exists | Line 415 |
| Main category "Macramé" button | `catalog-main-category-macrame` | ✅ Exists | Line 426 |
| Search input | `catalog-search-input` | ⚠️ Needs verification | Line 437 |
| View toggle grid | - | ❌ Missing | Line ~440 |
| View toggle list | - | ❌ Missing | Line ~440 |
| Product list container | `catalog-product-list` | ⚠️ Needs verification | - |
| Product cards | `catalog-product-card-{id}` | ⚠️ Needs verification | - |
| Product count | `catalog-product-count` | ⚠️ Needs verification | - |
| Empty state | `catalog-empty-state` | ⚠️ Needs verification | - |

### CategoryFilter.tsx (Sidebar Filters)

| Element | data-testid | Status | Location |
|---------|-------------|--------|----------|
| Filter container | `catalog-filters` | ⚠️ Needs verification | Line 59 |
| "Todas las categorías" button | `catalog-subcategory-filter-all` | ✅ **ADDED** | Line 73 |
| Subcategory buttons | `catalog-subcategory-filter-{name}` | ✅ **ADDED** | Line 122 |
| Inventory filter checkboxes | `catalog-inventory-filter-*` | ✅ **ADDED** | Lines 166-206 |
| Price range filter checkboxes | `catalog-price-filter-*` | ✅ **ADDED** | Lines 240-260 |
| "Limpiar" buttons | `catalog-inventory-filter-clear`, `catalog-price-filter-clear` | ✅ **ADDED** | Lines 153, 227 |

---

## 🎯 Recommended Data-TestID Attributes

### Priority 1: Critical (Prevents Strict Mode Violations)

#### CategoryFilter.tsx

```tsx
// Line 66: "Todas las categorías" button
<button
  onClick={() => onCategoryChange('all')}
  data-testid="catalog-subcategory-filter-all"  // ✅ ADD THIS
  className={...}
>
  <span className="flex items-center justify-between">
    <span>Todas las categorías</span>
    <span className="text-sm text-gray-400">{totalProducts}</span>
  </span>
</button>

// Line 113: Subcategory buttons
<button
  key={category.id}
  onClick={() => onCategoryChange(category.name)}
  data-testid={`catalog-subcategory-filter-${category.name.toLowerCase().replace(/\s+/g, '-')}`}  // ✅ ADD THIS
  className={...}
>
  <span className="flex items-center justify-between">
    <span>{category.name}</span>
    <span className="text-sm text-gray-400">{category.product_count || 0}</span>
  </span>
</button>
```

### Priority 2: Important (Improves Test Stability)

#### CategoryFilter.tsx - Inventory Filters

```tsx
// Line 158: Pieza Única checkbox
<input 
  type="checkbox" 
  checked={inventoryFilters.pieza_unica}
  onChange={() => handleInventoryFilterChange('pieza_unica')}
  data-testid="catalog-inventory-filter-pieza-unica"  // ✅ ADD THIS
  className={...}
/>

// Line 167: Encargo Mismo Material checkbox
<input 
  type="checkbox" 
  checked={inventoryFilters.por_encargue_con_stock}
  onChange={() => handleInventoryFilterChange('por_encargue_con_stock')}
  data-testid="catalog-inventory-filter-encargo-mismo-material"  // ✅ ADD THIS
  className={...}
/>

// Line 176: Encargo Diferente Material checkbox
<input 
  type="checkbox" 
  checked={inventoryFilters.por_encargue_sin_stock}
  onChange={() => handleInventoryFilterChange('por_encargue_sin_stock')}
  data-testid="catalog-inventory-filter-encargo-diferente-material"  // ✅ ADD THIS
  className={...}
/>

// Line 185: No Disponible checkbox
<input 
  type="checkbox" 
  checked={inventoryFilters.sin_stock}
  onChange={() => handleInventoryFilterChange('sin_stock')}
  data-testid="catalog-inventory-filter-no-disponible"  // ✅ ADD THIS
  className={...}
/>

// Line 194: En Stock checkbox
<input 
  type="checkbox" 
  checked={inventoryFilters.en_stock}
  onChange={() => handleInventoryFilterChange('en_stock')}
  data-testid="catalog-inventory-filter-en-stock"  // ✅ ADD THIS
  className={...}
/>

// Line 142: Clear inventory filters button
<button
  onClick={() => onInventoryFilterChange({...})}
  data-testid="catalog-inventory-filter-clear"  // ✅ ADD THIS
  className={...}
>
  Limpiar
</button>
```

#### CategoryFilter.tsx - Price Range Filters

```tsx
// Line 226: Menos de $50.000 checkbox
<input 
  type="checkbox" 
  checked={priceRangeFilters.lessThan50k}
  onChange={() => handlePriceRangeFilterChange('lessThan50k')}
  data-testid="catalog-price-filter-less-than-50k"  // ✅ ADD THIS
  className={...}
/>

// Line 235: $50.000 - $100.000 checkbox
<input 
  type="checkbox" 
  checked={priceRangeFilters.between50k100k}
  onChange={() => handlePriceRangeFilterChange('between50k100k')}
  data-testid="catalog-price-filter-50k-100k"  // ✅ ADD THIS
  className={...}
/>

// Line 244: Más de $100.000 checkbox
<input 
  type="checkbox" 
  checked={priceRangeFilters.moreThan100k}
  onChange={() => handlePriceRangeFilterChange('moreThan100k')}
  data-testid="catalog-price-filter-more-than-100k"  // ✅ ADD THIS
  className={...}
/>

// Line 212: Clear price filters button
<button
  onClick={() => onPriceRangeFilterChange({...})}
  data-testid="catalog-price-filter-clear"  // ✅ ADD THIS
  className={...}
>
  Limpiar
</button>
```

#### CatalogPage.tsx - View Toggle Buttons

```tsx
// Line ~440: View toggle buttons (need to verify exact location)
<button
  onClick={() => setViewMode('grid')}
  data-testid="catalog-view-toggle-grid"  // ✅ ADD THIS
  className={...}
>
  {/* Grid icon */}
</button>

<button
  onClick={() => setViewMode('list')}
  data-testid="catalog-view-toggle-list"  // ✅ ADD THIS
  className={...}
>
  {/* List icon */}
</button>
```

### Priority 3: Nice to Have (Future Tests)

#### ProductCard Component

```tsx
// Product card container
<div
  data-testid={`catalog-product-card-${product.id}`}  // ✅ ADD THIS
  className="product-card"
>
  {/* Product image */}
  <img
    data-testid={`catalog-product-card-${product.id}-image`}  // ✅ ADD THIS
    src={product.image_url}
    alt={product.name}
  />
  
  {/* Product title */}
  <h3
    data-testid={`catalog-product-card-${product.id}-title`}  // ✅ ADD THIS
  >
    {product.name}
  </h3>
  
  {/* Product price */}
  <span
    data-testid={`catalog-product-card-${product.id}-price`}  // ✅ ADD THIS
  >
    ${product.price}
  </span>
  
  {/* "Ver Detalles" button */}
  <Link
    to={`/producto/${product.id}`}
    data-testid={`catalog-product-card-${product.id}-details-link`}  // ✅ ADD THIS
  >
    Ver Detalles
  </Link>
</div>
```

---

## 📋 Implementation Checklist

### Immediate (Fix Current Issue)
- [x] Add `data-testid="catalog-subcategory-filter-all"` to "Todas las categorías" button (CategoryFilter.tsx:73) ✅ **COMPLETE**
- [x] Add `data-testid` to subcategory filter buttons (CategoryFilter.tsx:122) ✅ **COMPLETE**

### Short-Term (Improve Test Stability)
- [x] Add `data-testid` to all inventory filter checkboxes (CategoryFilter.tsx:166-206) ✅ **COMPLETE**
- [x] Add `data-testid` to all price range filter checkboxes (CategoryFilter.tsx:240-260) ✅ **COMPLETE**
- [x] Add `data-testid` to "Limpiar" buttons (CategoryFilter.tsx:153, 227) ✅ **COMPLETE**
- [ ] Add `data-testid` to view toggle buttons (CatalogPage.tsx:~440) ⏳ **PENDING**

### Medium-Term (Future Test Coverage)
- [ ] Verify and add `data-testid` to product cards (ProductCard.tsx)
- [ ] Verify and add `data-testid` to empty state (CatalogPage.tsx)
- [ ] Verify and add `data-testid` to product count display (CatalogPage.tsx)
- [ ] Verify and add `data-testid` to product list container (CatalogPage.tsx)

---

## 🔧 Test Fixes Applied

### 1. Fixed Strict Mode Violation

**Before:**
```typescript
const todasButton = page.getByRole('button', { name: /todas/i }).or(
  page.locator('button').filter({ hasText: /todas/i }).first()
);
```

**After:**
```typescript
const todasButton = catalogPage.locator(TestSelectors.catalogMainCategoryAll).or(
  catalogPage.locator('[data-testid="catalog-main-category-all"]')
);
```

**Key Changes:**
- ✅ Use specific `data-testid` selector
- ✅ Scope to `catalogPage` to avoid matching sidebar buttons
- ✅ Updated selectors.ts with new constants

### 2. Updated Selectors

Added to `selectors.ts`:
- `catalogMainCategoryAll`
- `catalogMainCategoryCuero`
- `catalogMainCategoryMacrame`
- `catalogSubcategoryFilterAll`
- `catalogSubcategoryFilter(categoryName)`
- `catalogViewToggleGrid`
- `catalogViewToggleList`

### 3. Removed Hardcoded Timeout

**Before:**
```typescript
await page.waitForTimeout(300); // Small delay for scroll
```

**After:**
```typescript
await waitForScrollToComplete(page, 500);
```

---

## 🎯 Naming Convention

### Pattern: `[area]-[component]-[element]-[identifier]`

**Examples:**
- `catalog-main-category-all` - Main category filter button "All"
- `catalog-subcategory-filter-all` - Subcategory filter button "All Categories"
- `catalog-inventory-filter-pieza-unica` - Inventory filter checkbox
- `catalog-price-filter-50k-100k` - Price range filter checkbox
- `catalog-view-toggle-grid` - View mode toggle button (grid)
- `catalog-product-card-{id}` - Product card container

### Rules:
1. **Kebab-case** (lowercase with hyphens)
2. **Descriptive** (clear what element it is)
3. **Hierarchical** (area → component → element)
4. **Unique** (no duplicates within same scope)
5. **Indexed** (for repeated elements: `-{id}` or `-{index}`)

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't:
- Use generic names like `button`, `link`, `input`
- Use text content as identifier (text can change)
- Create ambiguous selectors that match multiple elements
- Use class names or IDs (they can change with styling)

### ✅ Do:
- Use specific, descriptive names
- Scope selectors to parent containers
- Use `data-testid` as primary selector
- Provide fallback selectors for backward compatibility

---

## 📊 Test Flow Analysis

### Current Test Flow:
1. Navigate to catalog page
2. Verify page load and basic elements
3. **Verify sidebar filters** (CategoryFilter component)
4. **Verify main category filters** (CatalogPage component) ← **Issue here**
5. Verify search input
6. Verify view toggle buttons
7. Verify Supabase API call
8. Verify products display
9. Verify product card content

### Potential Issues:
1. ✅ **FIXED:** Main category filter buttons matching subcategory buttons
2. ⚠️ **POTENTIAL:** View toggle buttons may match other buttons
3. ⚠️ **POTENTIAL:** Product cards may not have unique identifiers
4. ⚠️ **POTENTIAL:** Inventory/price filters may not be testable without `data-testid`

---

## 📝 Next Steps

1. **Immediate:** Add `data-testid` to "Todas las categorías" button
2. **Short-term:** Add `data-testid` to all filter elements
3. **Medium-term:** Verify and add `data-testid` to product cards
4. **Long-term:** Create comprehensive `data-testid` coverage for all interactive elements

---

**Last Updated:** January 2026  
**Status:** Test fixed ✅ | CategoryFilter.tsx data-testid attributes added ✅  
**Priority:** High (prevents strict mode violations)

---

## ✅ Implementation Status

### CategoryFilter.tsx - COMPLETE ✅

All Priority 1 and Priority 2 data-testid attributes have been successfully added:

- ✅ **Line 73:** `catalog-subcategory-filter-all` - "Todas las categorías" button
- ✅ **Line 122:** `catalog-subcategory-filter-{name}` - Dynamic subcategory buttons
- ✅ **Line 153:** `catalog-inventory-filter-clear` - Clear inventory filters button
- ✅ **Line 166:** `catalog-inventory-filter-pieza-unica` - Pieza Única checkbox
- ✅ **Line 176:** `catalog-inventory-filter-encargo-mismo-material` - Encargo Mismo Material checkbox
- ✅ **Line 186:** `catalog-inventory-filter-encargo-diferente-material` - Encargo Diferente Material checkbox
- ✅ **Line 196:** `catalog-inventory-filter-no-disponible` - No Disponible checkbox
- ✅ **Line 206:** `catalog-inventory-filter-en-stock` - En Stock checkbox
- ✅ **Line 227:** `catalog-price-filter-clear` - Clear price filters button
- ✅ **Line 240:** `catalog-price-filter-less-than-50k` - Menos de $50.000 checkbox
- ✅ **Line 250:** `catalog-price-filter-50k-100k` - $50.000 - $100.000 checkbox
- ✅ **Line 260:** `catalog-price-filter-more-than-100k` - Más de $100.000 checkbox

**Total:** 12 data-testid attributes added ✅

### Next Steps

1. ✅ **Test the fix:** Run `catalog-page-loads-and-displays-all-products.spec.ts` to verify strict mode violation is resolved
2. ⏳ **Add view toggle data-testid:** Add to CatalogPage.tsx view toggle buttons (Priority 2)
3. ⏳ **Verify product cards:** Check if ProductCard component has data-testid attributes (Priority 3)
