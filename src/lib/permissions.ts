/**
 * Central registry of all system permissions.
 * This ensures that permission strings are consistent across the app.
 */

export const ALL_PERMISSIONS = [
  // Module Access
  'module:master',
  'module:grey',
  'module:warehouse',
  'module:rfd',
  'module:printing',
  'module:dispatch',
  'module:reports',
  
  // Specific Actions
  'settings:roles',
  'settings:team',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

/**
 * Helper to check if a permission list contains a specific permission.
 * Includes a fallback for SuperAdmins/Admins who should have access to everything.
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!requiredPermission) return true;
  return userPermissions.includes(requiredPermission);
}

/**
 * Human-readable labels for the permissions UI
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'module:master': 'Master Data (Customers, Vendors, Items)',
  'module:grey': 'Grey Module',
  'module:warehouse': 'Warehouse & Batch Management',
  'module:rfd': 'RFD Process (Issue/Receive)',
  'module:printing': 'Printing Process (Issue/Receive)',
  'module:dispatch': 'Dispatch & Delivery Challans',
  'module:reports': 'Access Reports',
  'settings:roles': 'Manage Roles & Permissions',
  'settings:team': 'Manage Organization Team',
};
