import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // All permissions - Admin has full access
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.PRODUCTS_IMPORT,
    Permission.PRODUCTS_EXPORT,
    Permission.LEADS_CREATE,
    Permission.LEADS_READ,
    Permission.LEADS_UPDATE,
    Permission.LEADS_DELETE,
    Permission.LEADS_EXPORT,
    Permission.USERS_CREATE,
    Permission.USERS_READ,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_ADVANCED,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_ROLLBACK,
    Permission.SYSTEM_SETTINGS,
    Permission.SYSTEM_LOGS,
  ],
  [Role.VENDEDOR]: [
    // Products - Read and basic operations
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_EXPORT,
    // Leads - Full management
    Permission.LEADS_CREATE,
    Permission.LEADS_READ,
    Permission.LEADS_UPDATE,
    Permission.LEADS_DELETE,
    Permission.LEADS_EXPORT,
    // Analytics - Basic only
    Permission.ANALYTICS_READ,
    // Inventory - Read only
    Permission.INVENTORY_READ,
  ],
  [Role.VISOR]: [
    // Read-only access
    Permission.PRODUCTS_READ,
    Permission.LEADS_READ,
    Permission.ANALYTICS_READ,
    Permission.INVENTORY_READ,
  ],
};
