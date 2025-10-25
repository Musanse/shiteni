// All system roles for multi-vending platform
export type UserRole = 
  | 'customer'
  | 'super_admin'
  | 'admin'
  | 'manager'
  // Hotel roles
  | 'receptionist'
  | 'housekeeping'
  // Store roles
  | 'cashier'
  | 'inventory_manager'
  | 'sales_associate'
  // Pharmacy roles
  | 'pharmacist'
  | 'technician'
  | 'pharmacy_cashier'
  // Bus roles
  | 'driver'
  | 'conductor'
  | 'ticket_seller'
  | 'dispatcher'
  | 'maintenance'
  // Institution roles
  | 'loan_officer'
  | 'credit_analyst'
  | 'customer_service';

// Role labels for display
export const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  manager: 'Vendor Manager',
  // Hotel roles
  receptionist: 'Receptionist',
  housekeeping: 'Housekeeping',
  // Store roles
  cashier: 'Cashier',
  inventory_manager: 'Inventory Manager',
  sales_associate: 'Sales Associate',
  // Pharmacy roles
  pharmacist: 'Pharmacist',
  technician: 'Pharmacy Technician',
  pharmacy_cashier: 'Pharmacy Cashier',
  // Bus roles
  driver: 'Driver',
  conductor: 'Conductor',
  ticket_seller: 'Ticket Seller',
  dispatcher: 'Dispatcher',
  maintenance: 'Maintenance',
  // Institution roles
  loan_officer: 'Loan Officer',
  credit_analyst: 'Credit Analyst',
  customer_service: 'Customer Service',
};
