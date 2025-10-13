export const PERMISSIONS = {
  // Pharmacy permissions
  VIEW_MEDICINES: 'view_medicines',
  ADD_MEDICINES: 'add_medicines',
  EDIT_MEDICINES: 'edit_medicines',
  DELETE_MEDICINES: 'delete_medicines',
  VIEW_INVENTORY: 'view_inventory',
  
  // Hospital permissions
  MANAGE_PATIENTS: 'manage_patients',
  VIEW_PATIENTS: 'view_patients',
  CREATE_INVESTIGATIONS: 'create_investigations',
  VIEW_INVESTIGATIONS: 'view_investigations',
  MANAGE_ADMISSIONS: 'manage_admissions',
  VIEW_ADMISSIONS: 'view_admissions',
  OUTDOOR_SALES: 'outdoor_sales',
  INDOOR_SALES: 'indoor_sales',
  DISCHARGE_PATIENTS: 'discharge_patients',
  MANAGE_DOCTORS: 'manage_doctors',
  MANAGE_BEDS: 'manage_beds',
  MANAGE_SERVICES: 'manage_services',
  
  // System permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SALES: 'manage_sales'
};

// Updated role definitions
export const ROLES = {
  admin: {
    name: 'Admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS)
  },
  manager: {
    name: 'Manager',
    description: 'Hospital and pharmacy manager',
    permissions: [
      PERMISSIONS.VIEW_MEDICINES,
      PERMISSIONS.ADD_MEDICINES,
      PERMISSIONS.EDIT_MEDICINES,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.MANAGE_PATIENTS,
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.CREATE_INVESTIGATIONS,
      PERMISSIONS.VIEW_INVESTIGATIONS,
      PERMISSIONS.MANAGE_ADMISSIONS,
      PERMISSIONS.VIEW_ADMISSIONS,
      PERMISSIONS.DISCHARGE_PATIENTS,
      PERMISSIONS.MANAGE_DOCTORS,
      PERMISSIONS.MANAGE_BEDS,
      PERMISSIONS.MANAGE_SERVICES,
      PERMISSIONS.VIEW_REPORTS
    ]
  },
  doctor: {
    name: 'Doctor',
    description: 'Medical staff',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.MANAGE_PATIENTS,
      PERMISSIONS.VIEW_ADMISSIONS,
      PERMISSIONS.MANAGE_ADMISSIONS,
      PERMISSIONS.CREATE_INVESTIGATIONS,
      PERMISSIONS.VIEW_INVESTIGATIONS,
      PERMISSIONS.VIEW_MEDICINES
    ]
  },
  receptionist: {
    name: 'Receptionist',
    description: 'Front desk operations',
    permissions: [
      PERMISSIONS.MANAGE_PATIENTS,
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.CREATE_INVESTIGATIONS,
      PERMISSIONS.VIEW_INVESTIGATIONS,
      PERMISSIONS.MANAGE_ADMISSIONS,
      PERMISSIONS.VIEW_ADMISSIONS
    ]
  },
  pharmacist: {
    name: 'Pharmacist',
    description: 'Pharmacy operations',
    permissions: [
      PERMISSIONS.VIEW_MEDICINES,
      PERMISSIONS.ADD_MEDICINES,
      PERMISSIONS.EDIT_MEDICINES,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.OUTDOOR_SALES,
      PERMISSIONS.INDOOR_SALES
    ]
  },
  cashier: {
    name: 'Cashier',
    description: 'Billing and payments',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.VIEW_INVESTIGATIONS,
      PERMISSIONS.VIEW_ADMISSIONS,
      PERMISSIONS.DISCHARGE_PATIENTS,
      PERMISSIONS.OUTDOOR_SALES,
      PERMISSIONS.INDOOR_SALES
    ]
  },
  viewer: {
    name: 'Viewer',
    description: 'View only access',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.VIEW_INVESTIGATIONS,
      PERMISSIONS.VIEW_ADMISSIONS,
      PERMISSIONS.VIEW_MEDICINES,
      PERMISSIONS.VIEW_INVENTORY
    ]
  }
};

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions && user.permissions.includes(permission);
}

export function hasAnyPermission(user, permissions) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.some(permission => 
    user.permissions && user.permissions.includes(permission)
  );
}

export function getPermissionLabel(permission) {
  const labels = {
    view_medicines: 'View Medicines',
    add_medicines: 'Add Medicines',
    edit_medicines: 'Edit Medicines',
    delete_medicines: 'Delete Medicines',
    view_inventory: 'View Inventory',
    manage_patients: 'Manage Patients',
    view_patients: 'View Patients',
    create_investigations: 'Create Investigations',
    view_investigations: 'View Investigations',
    manage_admissions: 'Manage Admissions',
    view_admissions: 'View Admissions',
    outdoor_sales: 'Outdoor Sales',
    indoor_sales: 'Indoor Sales',
    discharge_patients: 'Discharge Patients',
    manage_doctors: 'Manage Doctors',
    manage_beds: 'Manage Beds',
    manage_services: 'Manage Services',
    manage_users: 'Manage Users',
    manage_roles: 'Manage Roles',
    view_reports: 'View Reports',
    manage_sales: 'Manage Sales'
  };
  return labels[permission] || permission;
}

