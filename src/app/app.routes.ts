import { Routes } from '@angular/router';
import { adminGuard, superAdminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
    title: 'Sign in · TheSalori Admin',
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/shell').then((m) => m.ShellComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
        title: 'Dashboard · TheSalori Admin',
      },
      {
        path: 'packages',
        loadComponent: () =>
          import('./features/packages/package-list').then((m) => m.PackageListPage),
        title: 'Packages · TheSalori Admin',
      },
      {
        path: 'packages/new',
        loadComponent: () =>
          import('./features/packages/package-form').then((m) => m.PackageFormPage),
        title: 'New package · TheSalori Admin',
      },
      {
        path: 'packages/:id/edit',
        loadComponent: () =>
          import('./features/packages/package-form').then((m) => m.PackageFormPage),
        title: 'Edit package · TheSalori Admin',
      },
      {
        path: 'packages/:id/content',
        loadComponent: () =>
          import('./features/packages/package-content').then((m) => m.PackageContentPage),
        title: 'Package content · TheSalori Admin',
      },
      {
        path: 'packages/:id/departures',
        loadComponent: () =>
          import('./features/departures/departures').then((m) => m.DeparturesPage),
        title: 'Departures · TheSalori Admin',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list').then((m) => m.ProductListPage),
        title: 'Products · TheSalori Admin',
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-form').then((m) => m.ProductFormPage),
        title: 'New product · TheSalori Admin',
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/products/product-form').then((m) => m.ProductFormPage),
        title: 'Edit product · TheSalori Admin',
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/order-list').then((m) => m.OrderListPage),
        title: 'Orders · TheSalori Admin',
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetailPage),
        title: 'Order · TheSalori Admin',
      },
      {
        path: 'returns',
        loadComponent: () => import('./features/orders/returns').then((m) => m.ReturnsPage),
        title: 'Returns · TheSalori Admin',
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/reviews/reviews').then((m) => m.ReviewsPage),
        title: 'Reviews · TheSalori Admin',
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./features/collections/collection-list').then((m) => m.CollectionListPage),
        title: 'Collections · TheSalori Admin',
      },
      {
        path: 'collections/new',
        loadComponent: () =>
          import('./features/collections/collection-form').then((m) => m.CollectionFormPage),
        title: 'New collection · TheSalori Admin',
      },
      {
        path: 'collections/:id/edit',
        loadComponent: () =>
          import('./features/collections/collection-form').then((m) => m.CollectionFormPage),
        title: 'Edit collection · TheSalori Admin',
      },
      {
        path: 'shipping',
        loadComponent: () => import('./features/shop-config/shipping').then((m) => m.ShippingPage),
        title: 'Shipping · TheSalori Admin',
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/coupons/coupons').then((m) => m.CouponsPage),
        title: 'Coupons · TheSalori Admin',
      },
      {
        path: 'departures/:id/manifest',
        loadComponent: () => import('./features/departures/manifest').then((m) => m.ManifestPage),
        title: 'Manifest · TheSalori Admin',
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings').then((m) => m.BookingsPage),
        title: 'Bookings · TheSalori Admin',
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage),
        title: 'Reports · TheSalori Admin',
      },
      {
        path: 'taxonomy',
        loadComponent: () => import('./features/taxonomy/taxonomy').then((m) => m.TaxonomyPage),
        title: 'Taxonomy · TheSalori Admin',
      },
      {
        path: 'content/pages',
        loadComponent: () => import('./features/content/cms-list').then((m) => m.CmsListPage),
        title: 'Content pages · TheSalori Admin',
      },
      {
        path: 'content/pages/new',
        loadComponent: () => import('./features/content/cms-form').then((m) => m.CmsFormPage),
        title: 'New page · TheSalori Admin',
      },
      {
        path: 'content/pages/:id/edit',
        loadComponent: () => import('./features/content/cms-form').then((m) => m.CmsFormPage),
        title: 'Edit page · TheSalori Admin',
      },
      {
        path: 'content/blog',
        loadComponent: () => import('./features/blog/blog-list').then((m) => m.BlogListPage),
        title: 'Blog · TheSalori Admin',
      },
      {
        path: 'content/blog/categories',
        loadComponent: () =>
          import('./features/blog/blog-categories').then((m) => m.BlogCategoriesPage),
        title: 'Blog categories · TheSalori Admin',
      },
      {
        path: 'content/blog/new',
        loadComponent: () => import('./features/blog/blog-form').then((m) => m.BlogFormPage),
        title: 'New post · TheSalori Admin',
      },
      {
        path: 'content/blog/:id/edit',
        loadComponent: () => import('./features/blog/blog-form').then((m) => m.BlogFormPage),
        title: 'Edit post · TheSalori Admin',
      },
      {
        path: 'team/users',
        loadComponent: () => import('./features/team/team-users').then((m) => m.TeamUsersPage),
        title: 'Team · TheSalori Admin',
      },
      {
        path: 'team/roles',
        loadComponent: () => import('./features/team/team-roles').then((m) => m.TeamRolesPage),
        title: 'Roles & permissions · TheSalori Admin',
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers').then((m) => m.CustomersPage),
        title: 'Customers · TheSalori Admin',
      },
      {
        path: 'team/module-access',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./features/team/module-access').then((m) => m.ModuleAccessPage),
        title: 'Module Access · TheSalori Admin',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
        title: 'Settings · TheSalori Admin',
      },
    ],
  },
];
