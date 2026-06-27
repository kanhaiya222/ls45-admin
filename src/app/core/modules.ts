/**
 * Admin "modules" — the operational areas a super-admin can grant to a role from the Module Access
 * screen, and the permission each one is gated by in the sidebar. Each module maps to a single
 * representative access permission (`permission`, used for visibility) plus the set of permission
 * codes written to a role when the module is toggled on (`grantCodes`).
 *
 * Team / Roles / Module Access are deliberately NOT here — they are sensitive tenant-administration
 * functions kept to TENANT_ADMIN / SUPER_ADMIN and are not delegable via the matrix.
 */
export interface AdminModule {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly permission: string;
  readonly grantCodes: readonly string[];
}

export const ADMIN_MODULES: readonly AdminModule[] = [
  {
    id: 'catalogue',
    label: 'Catalogue',
    description: 'Packages & taxonomy',
    permission: 'package:read:all',
    grantCodes: ['package:read:all'],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    description: 'Bookings & payments',
    permission: 'booking:read:all',
    grantCodes: ['booking:read:all'],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Dashboards & exports',
    permission: 'report:read:all',
    grantCodes: ['report:read:all'],
  },
  {
    id: 'content',
    label: 'Content',
    description: 'CMS pages & blog',
    permission: 'content:read:all',
    grantCodes: ['content:read:all', 'content:manage:all'],
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Customer accounts',
    permission: 'user:read:all',
    grantCodes: ['user:read:all'],
  },
];
