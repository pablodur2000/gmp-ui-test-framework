# GMP Web App - Route & Flow Analysis

## Application Routes

### Public Routes (No Authentication Required)
```
/                          → HomePage
/catalogo                  → CatalogPage  
/producto/:id              → ProductDetailPage
```

### Admin Routes (Authentication Required)
```
/admin/login               → AdminLoginPage
/admin/dashboard           → AdminDashboardPage (protected)
```

**Note:** Base path is `/gmp-web-app` (from BrowserRouter basename in main.tsx)

---

## Critical User Flows Mapped

### Flow 1: Public Product Browsing
```
Home Page (/)
  ↓ (Click "Ver Catálogo" or navigate to Catalog)
Catalog Page (/catalogo)
  ↓ (Click on product card)
Product Detail Page (/producto/:id)
  ↓ (Click "Volver al Catálogo")
Catalog Page (/catalogo)
```

**Key Interactions:**
- Home page displays hero, featured products, location info
- Catalog page: filter by category, search, view mode toggle
- Product detail: image gallery, product info, navigation

### Flow 2: Admin Authentication & Dashboard Access
```
Admin Login Page (/admin/login)
  ↓ (Enter credentials, submit)
Admin Dashboard (/admin/dashboard)
  ↓ (Check user, verify admin_users table)
Admin Dashboard (if authorized)
  OR
Admin Login Page (if unauthorized)
```

**Key Interactions:**
- Email/password form
- Password visibility toggle
- Error message display
- Redirect on success/failure

### Flow 3: Admin Product Management
```
Admin Dashboard (/admin/dashboard)
  ↓ (Click "Agregar Producto")
Product Form Modal
  ↓ (Fill form, submit)
Admin Dashboard (product created, activity logged)
  ↓ (Click "Gestionar Productos")
Products Catalog View
  ↓ (Click "Editar" on product)
Product Edit Form Modal
  ↓ (Update fields, submit)
Admin Dashboard (product updated, activity logged)
  ↓ (Click "Eliminar" on product)
Delete Confirmation Modal
  ↓ (Confirm deletion)
Admin Dashboard (product deleted, activity logged)
```

**Key Interactions:**
- Modal open/close
- Form validation
- Search functionality
- Delete confirmation
- Activity logging

### Flow 4: Admin Sales Management
```
Admin Dashboard (/admin/dashboard)
  ↓ (Click "Ver Ventas")
Sales View
  ↓ (Search by customer name)
Filtered Sales List
  ↓ (Change status dropdown)
Sale Status Updated
  ↓ (Activity logged)
Sales View (refreshed)
```

**Key Interactions:**
- View toggle (show/hide sales)
- Search functionality
- Status dropdown updates
- Activity logging

### Flow 5: Admin Activity Logs
```
Admin Dashboard (/admin/dashboard)
  ↓ (View Recent Activity - default view)
Activity Logs View
  ↓ (Search by resource name or email)
Filtered Activity Logs
  ↓ (Filter by action type: CREATE/UPDATE/DELETE)
Filtered Activity Logs
  ↓ (Click delete on log entry)
Activity Log Deleted
```

**Key Interactions:**
- Search functionality
- Filter pills (CREATE/UPDATE/DELETE)
- Delete action
- Success notification

---

## Component Interaction Map

### Header Component
- **Desktop:** Logo, navigation links, catalog dropdown, CTA button
- **Mobile:** Hamburger menu, mobile navigation
- **Interactions:** Hover for dropdown, click for navigation, toggle mobile menu

### Catalog Page Components
- **CategoryFilter:** Sidebar with categories and inventory status filters
- **SearchBar:** Product search with debounce (500ms)
- **ProductCard:** Product display (grid/list view)
- **View Toggle:** Grid/List mode switch

### Admin Dashboard Components
- **ProductForm:** Create new product (modal)
- **ProductEditForm:** Edit existing product (modal)
- **DeleteConfirmationModal:** Confirm product deletion
- **SearchBar:** Search products/sales/activity
- **Status Dropdown:** Update sale status

---

## Data Flow Analysis

### Public Catalog
1. **Load Categories:** Query `categories` table, get product counts
2. **Load Products:** Query `products` table with filters:
   - `available = true`
   - `inventory_status != 'no_disponible'`
   - Filter by `main_category` (cuero/macrame)
   - Filter by `category_id`
   - Filter by `inventory_status`
   - Search by `title` or `description` (ilike)
3. **Product Detail:** Query single product by ID

### Admin Dashboard
1. **Authentication Check:**
   - Get current user from `supabase.auth.getUser()`
   - Check `admin_users` table for email match
   - Redirect if not admin
2. **Load Products:** Query all products (no availability filter)
3. **Load Sales:** Query `sales` table, order by `created_at`
4. **Load Activity:** Query `activity_logs` table, limit 10, order by `created_at`
5. **Create/Update/Delete:** 
   - Perform operation
   - Log to `activity_logs` table
   - Refresh relevant data

---

## Key Test Scenarios by Route

### `/` (Home Page)
- ✅ Page loads
- ✅ Hero section displays
- ✅ Featured products section displays
- ✅ Location section displays
- ✅ Map modal opens/closes
- ✅ Navigation to catalog works

### `/catalogo` (Catalog Page)
- ✅ All products load
- ✅ Main category filter (Cuero/Macramé) works
- ✅ Subcategory filter works
- ✅ Inventory status filter works
- ✅ Search functionality works
- ✅ View mode toggle (grid/list) works
- ✅ Product count displays correctly
- ✅ Navigation to product detail works

### `/producto/:id` (Product Detail)
- ✅ Product information loads
- ✅ Image gallery works
- ✅ Breadcrumb navigation works
- ✅ Back to catalog navigation works

### `/admin/login` (Admin Login)
- ✅ Login form displays
- ✅ Valid credentials → redirect to dashboard
- ✅ Invalid credentials → error message
- ✅ Non-admin user → access denied error
- ✅ Password visibility toggle works

### `/admin/dashboard` (Admin Dashboard)
- ✅ Requires authentication (redirects if not logged in)
- ✅ Dashboard loads with user info
- ✅ Product count displays
- ✅ Product management works (CRUD)
- ✅ Sales management works (view, search, update status)
- ✅ Activity logs work (view, search, filter, delete)
- ✅ Sign out works

---

## Critical Test Data Requirements

### Test Admin User
- Email: (needs to be configured)
- Password: (needs to be configured)
- Must exist in `admin_users` table

### Test Products
- At least 5-10 products across different categories
- Mix of inventory statuses
- Mix of main categories (cuero/macrame)
- Some featured products

### Test Categories
- Multiple categories per main category
- Categories with product counts

### Test Sales
- At least 3-5 sales with different statuses
- Different customer names for search testing

### Test Activity Logs
- Various action types (CREATE/UPDATE/DELETE)
- Different resource types (PRODUCT/SALE)
- Recent entries for default view

---

## Implementation Priority

1. **Smoke Tests** - Verify critical paths work
2. **Public Routes** - No auth needed, easier to test
3. **Admin Authentication** - Foundation for admin tests
4. **Admin Product Management** - Core admin functionality
5. **Admin Sales & Activity** - Secondary admin features
6. **Integration Tests** - Complete flows

---

## Notes

- All routes are relative to `/gmp-web-app` base path
- Admin routes are not linked in public navigation (security)
- Product detail page currently uses mock data (needs Supabase integration)
- Activity logging happens automatically on admin actions
- Search uses debounce (500ms) to avoid excessive queries
- Filters combine (AND logic) - can filter by multiple criteria

