import { UserRole, BusinessStaffRole, businessRolePermissions, businessConfigs } from '@/types/business';

// Check if a user has permission to access a specific path
export function hasPermission(userRole: string, path: string): boolean {
  // Super admin has access to everything
  if (userRole === 'super_admin') {
    return true;
  }

  // System admin has access to admin routes
  if (userRole === 'admin' && path.startsWith('/dashboard/admin')) {
    return true;
  }

  // Handle manager and admin roles FIRST - they get full access to their service type
  if (userRole === 'manager' || userRole === 'admin') {
    // Extract service type from path
    const pathParts = path.split('/');
    if (pathParts.length >= 4 && pathParts[1] === 'dashboard' && pathParts[2] === 'vendor') {
      const serviceType = pathParts[3];
      const basePath = `/dashboard/vendor/${serviceType}`;
      
      // Manager and admin have access to entire dashboard (all modules)
      return path.startsWith(basePath);
    }
  }

  // Check business-specific permissions for staff roles (not manager/admin)
  const rolePermissions = businessRolePermissions[userRole as BusinessStaffRole];
  if (rolePermissions) {
    return rolePermissions.some(permission => path.startsWith(permission));
  }

  // Customer can only access customer routes
  if (userRole === 'customer') {
    return path.startsWith('/dashboard/customer');
  }

  // Default: no access
  return false;
}

// Get allowed modules for a user based on their role
export function getAllowedModules(userRole: string, serviceType?: string): string[] {
  // Super admin can see all modules
  if (userRole === 'super_admin') {
    return ['admin', 'vendors', 'users', 'staffs', 'subscription', 'statistics', 'settings', 'inbox'];
  }

  // System admin can see admin modules
  if (userRole === 'admin' && !serviceType) {
    return ['admin', 'vendors', 'users', 'staffs', 'subscription', 'statistics', 'settings', 'inbox'];
  }

  // Handle manager and admin roles first - they get all modules
  if ((userRole === 'manager' || userRole === 'admin') && serviceType) {
    // Both manager and admin have access to all modules in their service type
    return businessConfigs[serviceType as keyof typeof businessConfigs]?.modules || [];
  }

  // Business-specific modules based on role and service type (for staff roles)
  const rolePermissions = businessRolePermissions[userRole as BusinessStaffRole];
  if (rolePermissions && serviceType) {
    const modules: string[] = [];
    
    // Extract modules from permissions
    rolePermissions.forEach(permission => {
      if (permission.includes(`/dashboard/vendor/${serviceType}/`)) {
        const module = permission.split('/').pop();
        if (module && !modules.includes(module)) {
          modules.push(module);
        }
      }
    });

    return modules;
  }

  // Default: no modules
  return [];
}

// Check if user can access a specific module
export function canAccessModule(userRole: string, module: string, serviceType?: string): boolean {
  const allowedModules = getAllowedModules(userRole, serviceType);
  return allowedModules.includes(module);
}

// Get user's role display name
export function getRoleDisplayName(userRole: string): string {
  const roleLabels: Record<string, string> = {
    customer: 'Customer',
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    manager: 'Manager',
    cashier: 'Cashier',
    inventory_manager: 'Inventory Manager',
    sales_associate: 'Sales Associate',
    receptionist: 'Receptionist',
    housekeeping: 'Housekeeping',
    pharmacist: 'Pharmacist',
    technician: 'Pharmacy Technician',
    driver: 'Driver',
    conductor: 'Conductor',
    ticket_seller: 'Ticket Seller',
    dispatcher: 'Dispatcher',
    maintenance: 'Maintenance'
  };

  return roleLabels[userRole] || userRole;
}
