// Business types supported by Shiteni platform
export type BusinessType = 
  | 'hotel'
  | 'store'
  | 'pharmacy'
  | 'bus';

// Business-specific roles (excluding manager and admin - they're handled by general permissions)
export type HotelRole = 
  | 'receptionist'
  | 'housekeeping';

export type StoreRole = 
  | 'cashier'
  | 'inventory_manager'
  | 'sales_associate';

export type PharmacyRole = 
  | 'pharmacist'
  | 'technician'
  | 'cashier';

export type BusRole = 
  | 'driver'
  | 'conductor'
  | 'ticket_seller'
  | 'dispatcher'
  | 'maintenance';

// Combined business staff roles
export type BusinessStaffRole = 
  | HotelRole
  | StoreRole
  | PharmacyRole
  | BusRole;

// All system roles including business-specific
export type UserRole = 
  | 'customer'
  | 'super_admin'
  | 'manager'      // Vendor managers (full access to their service type)
  | 'admin'        // Vendor admins (full access to their service type)
  | BusinessStaffRole;

// Business type configurations
export interface BusinessConfig {
  type: BusinessType;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  modules: string[];
}

// Business configurations
export const businessConfigs: Record<BusinessType, BusinessConfig> = {
  hotel: {
    type: 'hotel',
    name: 'Hotel Management',
    description: 'Complete hotel reservation and management system',
    icon: 'Building2',
    color: 'primary',
    features: [
      'Room booking system',
      'Guest management',
      'Revenue tracking',
      'Staff scheduling',
      'Housekeeping management',
      'Payment processing'
    ],
    modules: [
      'bookings',
      'room-management',
      'in-house',
      'staff',
      'customers',
      'payments',
      'inbox',
      'analytics',
      'reports',
      'subscription',
      'settings'
    ]
  },
  store: {
    type: 'store',
    name: 'Online Store',
    description: 'E-commerce solution with complete shopping experience',
    icon: 'CreditCard',
    color: 'secondary',
    features: [
      'Product management',
      'Order processing',
      'Payment integration',
      'Inventory tracking',
      'Customer management',
      'Analytics dashboard',
      'Staff management',
      'Subscription management',
      'Messaging system',
      'Store settings'
    ],
    modules: [
      'products',
      'orders',
      'customers',
      'inventory',
      'inbox',
      'payments',
      'staffs',
      'subscription',
      'analytics',
      'settings'
    ]
  },
  pharmacy: {
    type: 'pharmacy',
    name: 'Pharmacy Store',
    description: 'Medicine management and prescription system',
    icon: 'Shield',
    color: 'accent',
    features: [
      'Drug inventory',
      'Prescription management',
      'Patient records',
      'Insurance integration',
      'Compliance tracking',
      'Drug interaction checks',
      'Staff management',
      'Subscription management',
      'Messaging system',
      'Pharmacy settings'
    ],
    modules: [
      'medicines',
      'orders',
      'patients',
      'inbox',
      'insurance',
      'compliance',
      'staffs',
      'subscription',
      'settings'
    ]
  },
  bus: {
    type: 'bus',
    name: 'Bus Management',
    description: 'Complete bus route management and ticketing system',
    icon: 'Users',
    color: 'primary',
    features: [
      'Route planning and management',
      'Bus stop management',
      'Trip scheduling',
      'Ticket booking system',
      'Passenger management',
      'Fleet management',
      'Staff management',
      'Payment processing',
      'Analytics and reporting',
      'Subscription management',
      'Settings and configuration'
    ],
    modules: [
      'routes',
      'stops',
      'fares',
      'schedule-trip',
      'bookings',
      'ticketing',
      'inbox',
      'fleet',
      'staffs',
      'passengers',
      'sending',
      'payments',
      'analytics',
      'subscription',
      'settings'
    ]
  }
};

// Role labels for display
export const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  super_admin: 'Super Administrator',
  manager: 'Manager',
  admin: 'Administrator',
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
  // Bus roles
  driver: 'Driver',
  conductor: 'Conductor',
  ticket_seller: 'Ticket Seller',
  dispatcher: 'Dispatcher',
  maintenance: 'Maintenance'
};

// Business-specific role permissions
export const businessRolePermissions: Record<BusinessStaffRole, string[]> = {
  // Hotel roles
  receptionist: [
    '/dashboard/vendor/hotel',
    '/dashboard/vendor/hotel/bookings',
    '/dashboard/vendor/hotel/customers',
    '/dashboard/vendor/hotel/in-house'
  ],
  housekeeping: [
    '/dashboard/vendor/hotel',
    '/dashboard/vendor/hotel/room-management',
    '/dashboard/vendor/hotel/in-house'
  ],
  // Note: manager and admin roles are handled by general permissions logic
  // Store roles
  cashier: [
    '/dashboard/vendor/store',
    '/dashboard/vendor/store/orders',
    '/dashboard/vendor/store/customers'
  ],
  inventory_manager: [
    '/dashboard/vendor/store',
    '/dashboard/vendor/store/products',
    '/dashboard/vendor/store/inventory'
  ],
  sales_associate: [
    '/dashboard/vendor/store',
    '/dashboard/vendor/store/products',
    '/dashboard/vendor/store/orders',
    '/dashboard/vendor/store/customers'
  ],
  // Note: manager and admin roles are defined above for hotel, but we need store-specific ones
  // These will be handled in the permissions utility
  // Pharmacy roles
  pharmacist: [
    '/dashboard/vendor/pharmacy',
    '/dashboard/vendor/pharmacy/medicines',
    '/dashboard/vendor/pharmacy/orders',
    '/dashboard/vendor/pharmacy/patients',
    '/dashboard/vendor/pharmacy/inbox',
    '/dashboard/vendor/pharmacy/insurance',
    '/dashboard/vendor/pharmacy/compliance'
  ],
  technician: [
    '/dashboard/vendor/pharmacy',
    '/dashboard/vendor/pharmacy/medicines',
    '/dashboard/vendor/pharmacy/orders',
    '/dashboard/vendor/pharmacy/patients',
    '/dashboard/vendor/pharmacy/inbox',
    '/dashboard/vendor/pharmacy/insurance'
  ],
  // Pharmacy cashier permissions (limited access for sales/checkout)
  pharmacy_cashier: [
    '/dashboard/vendor/pharmacy',
    '/dashboard/vendor/pharmacy/orders',
    '/dashboard/vendor/pharmacy/patients',
    '/dashboard/vendor/pharmacy/inbox'
  ],
  // Bus roles
  driver: [
    '/dashboard/vendor/bus',
    '/dashboard/vendor/bus/routes',
    '/dashboard/vendor/bus/schedule-trip',
    '/dashboard/vendor/bus/passengers',
    '/dashboard/vendor/bus/inbox'
  ],
  conductor: [
    '/dashboard/vendor/bus',
    '/dashboard/vendor/bus/bookings',
    '/dashboard/vendor/bus/ticketing',
    '/dashboard/vendor/bus/passengers',
    '/dashboard/vendor/bus/sending',
    '/dashboard/vendor/bus/inbox'
  ],
  dispatcher: [
    '/dashboard/vendor/bus',
    '/dashboard/vendor/bus/routes',
    '/dashboard/vendor/bus/stops',
    '/dashboard/vendor/bus/schedule-trip',
    '/dashboard/vendor/bus/fleet',
    '/dashboard/vendor/bus/inbox'
  ],
  ticket_seller: [
    '/dashboard/vendor/bus',
    '/dashboard/vendor/bus/bookings',
    '/dashboard/vendor/bus/ticketing',
    '/dashboard/vendor/bus/passengers',
    '/dashboard/vendor/bus/inbox'
  ],
  maintenance: [
    '/dashboard/vendor/bus',
    '/dashboard/vendor/bus/fleet',
    '/dashboard/vendor/bus/inbox'
  ],
  // Bus manager and admin roles (inherited from hotel but need bus-specific paths)
  // These will be handled by the permissions utility for bus service type
};
