import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
    title: 'Sign in · LS45 Admin',
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/shell').then((m) => m.ShellComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
        title: 'Dashboard · LS45 Admin',
      },
      {
        path: 'packages',
        loadComponent: () =>
          import('./features/packages/package-list').then((m) => m.PackageListPage),
        title: 'Packages · LS45 Admin',
      },
      {
        path: 'packages/new',
        loadComponent: () =>
          import('./features/packages/package-form').then((m) => m.PackageFormPage),
        title: 'New package · LS45 Admin',
      },
      {
        path: 'packages/:id/edit',
        loadComponent: () =>
          import('./features/packages/package-form').then((m) => m.PackageFormPage),
        title: 'Edit package · LS45 Admin',
      },
      {
        path: 'packages/:id/content',
        loadComponent: () =>
          import('./features/packages/package-content').then((m) => m.PackageContentPage),
        title: 'Package content · LS45 Admin',
      },
      {
        path: 'packages/:id/departures',
        loadComponent: () =>
          import('./features/departures/departures').then((m) => m.DeparturesPage),
        title: 'Departures · LS45 Admin',
      },
      {
        path: 'departures/:id/manifest',
        loadComponent: () => import('./features/departures/manifest').then((m) => m.ManifestPage),
        title: 'Manifest · LS45 Admin',
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings').then((m) => m.BookingsPage),
        title: 'Bookings · LS45 Admin',
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage),
        title: 'Reports · LS45 Admin',
      },
      {
        path: 'taxonomy',
        loadComponent: () => import('./features/taxonomy/taxonomy').then((m) => m.TaxonomyPage),
        title: 'Taxonomy · LS45 Admin',
      },
      {
        path: 'content/pages',
        loadComponent: () => import('./features/content/cms-list').then((m) => m.CmsListPage),
        title: 'Content pages · LS45 Admin',
      },
      {
        path: 'content/pages/new',
        loadComponent: () => import('./features/content/cms-form').then((m) => m.CmsFormPage),
        title: 'New page · LS45 Admin',
      },
      {
        path: 'content/pages/:id/edit',
        loadComponent: () => import('./features/content/cms-form').then((m) => m.CmsFormPage),
        title: 'Edit page · LS45 Admin',
      },
      {
        path: 'content/blog',
        loadComponent: () => import('./features/blog/blog-list').then((m) => m.BlogListPage),
        title: 'Blog · LS45 Admin',
      },
      {
        path: 'content/blog/categories',
        loadComponent: () =>
          import('./features/blog/blog-categories').then((m) => m.BlogCategoriesPage),
        title: 'Blog categories · LS45 Admin',
      },
      {
        path: 'content/blog/new',
        loadComponent: () => import('./features/blog/blog-form').then((m) => m.BlogFormPage),
        title: 'New post · LS45 Admin',
      },
      {
        path: 'content/blog/:id/edit',
        loadComponent: () => import('./features/blog/blog-form').then((m) => m.BlogFormPage),
        title: 'Edit post · LS45 Admin',
      },
      {
        path: 'team/users',
        loadComponent: () => import('./features/team/team-users').then((m) => m.TeamUsersPage),
        title: 'Team · LS45 Admin',
      },
      {
        path: 'team/roles',
        loadComponent: () => import('./features/team/team-roles').then((m) => m.TeamRolesPage),
        title: 'Roles & permissions · LS45 Admin',
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers').then((m) => m.CustomersPage),
        title: 'Customers · LS45 Admin',
      },
    ],
  },
];
