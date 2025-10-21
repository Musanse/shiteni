// Pharmacy role-based access control utility
export const PHARMACY_ROLES = {
  // Full access roles
  MANAGER: 'manager',
  ADMIN: 'admin',
  // Clinical roles
  PHARMACIST: 'pharmacist',
  TECHNICIAN: 'technician',
  // Sales role
  CASHIER: 'cashier'
} as const;

export const ALL_PHARMACY_ROLES = [
  PHARMACY_ROLES.MANAGER,
  PHARMACY_ROLES.ADMIN,
  PHARMACY_ROLES.PHARMACIST,
  PHARMACY_ROLES.TECHNICIAN,
  PHARMACY_ROLES.CASHIER
];

// Role-based permissions
export const PHARMACY_PERMISSIONS = {
  // Full access (manager, admin)
  FULL_ACCESS: [PHARMACY_ROLES.MANAGER, PHARMACY_ROLES.ADMIN],
  
  // Clinical access (pharmacist, technician)
  CLINICAL_ACCESS: [PHARMACY_ROLES.PHARMACIST, PHARMACY_ROLES.TECHNICIAN],
  
  // Sales access (cashier)
  SALES_ACCESS: [PHARMACY_ROLES.CASHIER],
  
  // Medicine management (pharmacist, technician, manager, admin)
  MEDICINE_MANAGEMENT: [PHARMACY_ROLES.PHARMACIST, PHARMACY_ROLES.TECHNICIAN, PHARMACY_ROLES.MANAGER, PHARMACY_ROLES.ADMIN],
  
  // Order management (all roles)
  ORDER_MANAGEMENT: ALL_PHARMACY_ROLES,
  
  // Patient management (all roles)
  PATIENT_MANAGEMENT: ALL_PHARMACY_ROLES,
  
  // Insurance management (pharmacist, technician, manager, admin)
  INSURANCE_MANAGEMENT: [PHARMACY_ROLES.PHARMACIST, PHARMACY_ROLES.TECHNICIAN, PHARMACY_ROLES.MANAGER, PHARMACY_ROLES.ADMIN],
  
  // Compliance management (pharmacist, manager, admin)
  COMPLIANCE_MANAGEMENT: [PHARMACY_ROLES.PHARMACIST, PHARMACY_ROLES.MANAGER, PHARMACY_ROLES.ADMIN],
  
  // Staff management (manager, admin only)
  STAFF_MANAGEMENT: [PHARMACY_ROLES.MANAGER, PHARMACY_ROLES.ADMIN],
  
  // Inbox access (all roles)
  INBOX_ACCESS: ALL_PHARMACY_ROLES
};

export function checkPharmacyAccess(
  userRole: string, 
  userServiceType: string, 
  requiredPermissions: string[]
): boolean {
  // Must be pharmacy service type
  if (userServiceType !== 'pharmacy') {
    return false;
  }
  
  // Check if user role has required permissions
  return requiredPermissions.includes(userRole);
}

export function getPharmacyRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [PHARMACY_ROLES.MANAGER]: 'Pharmacy Manager',
    [PHARMACY_ROLES.ADMIN]: 'Pharmacy Administrator',
    [PHARMACY_ROLES.PHARMACIST]: 'Pharmacist',
    [PHARMACY_ROLES.TECHNICIAN]: 'Pharmacy Technician',
    [PHARMACY_ROLES.CASHIER]: 'Pharmacy Cashier'
  };
  
  return roleNames[role] || role;
}
