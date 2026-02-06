export enum Permission {
  // Products
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_READ = 'products:read',
  PRODUCTS_UPDATE = 'products:update',
  PRODUCTS_DELETE = 'products:delete',
  PRODUCTS_IMPORT = 'products:import',
  PRODUCTS_EXPORT = 'products:export',

  // Leads
  LEADS_CREATE = 'leads:create',
  LEADS_READ = 'leads:read',
  LEADS_UPDATE = 'leads:update',
  LEADS_DELETE = 'leads:delete',
  LEADS_EXPORT = 'leads:export',

  // Users
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_ADVANCED = 'analytics:advanced',

  // Inventory
  INVENTORY_READ = 'inventory:read',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_ROLLBACK = 'inventory:rollback',

  // System
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
}
