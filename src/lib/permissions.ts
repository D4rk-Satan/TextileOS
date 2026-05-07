export type Permission = 
  | 'module:dashboard'
  | 'module:master'
  | 'module:grey'
  | 'module:warehouse'
  | 'module:rfd'
  | 'module:printing'
  | 'module:dispatch'
  | 'module:reports'
  | 'settings:team'
  | 'settings:organization'
  | 'settings:roles';

export const ALL_PERMISSIONS: Permission[] = [
  'module:dashboard',
  'module:master',
  'module:grey',
  'module:warehouse',
  'module:rfd',
  'module:printing',
  'module:dispatch',
  'module:reports',
  'settings:team',
  'settings:organization',
  'settings:roles'
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'module:dashboard': 'Dashboard Access',
  'module:master': 'Master Data Management (Customers, Vendors, Items)',
  'module:grey': 'Grey Inward Management',
  'module:warehouse': 'Warehouse & Batch Tracking',
  'module:rfd': 'RFD Process Management',
  'module:printing': 'Printing Process Management',
  'module:dispatch': 'Dispatch & Delivery Challans',
  'module:reports': 'Reports Access',
  'settings:team': 'Manage Team Members',
  'settings:organization': 'Manage Organization Settings',
  'settings:roles': 'Manage Roles & Permissions'
};

export function hasPermission(userPermissions: string[] | null | undefined, permission: Permission): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}
