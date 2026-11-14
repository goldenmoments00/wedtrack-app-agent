export type PermissionLevel = 'none' | 'view' | 'edit';

export type DestinationPermission =
  | 'Dashboard'
  | 'Orders'
  | 'Teams'
  | 'Assignments'
  | 'Payroll'
  | 'Work'
  | 'Packages'
  | 'Payments'
  | 'Activity'
  | 'Settings';

export interface MoneyPermissions {
  revenue: PermissionLevel;
  cost: PermissionLevel;
  margin: PermissionLevel;
}

export interface OrderSectionPermissions {
  client: PermissionLevel;
  crew: PermissionLevel;
  editing: PermissionLevel;
  payments: PermissionLevel;
}

export interface RolePermissions {
  destinations: DestinationPermission[];
  money: MoneyPermissions;
  orderSections: OrderSectionPermissions;
}

export const OWNER_ADMIN_PERMISSIONS: RolePermissions = {
  destinations: [
    'Dashboard',
    'Orders',
    'Teams',
    'Assignments',
    'Payroll',
    'Work',
    'Packages',
    'Payments',
    'Activity',
    'Settings',
  ],
  money: {
    revenue: 'edit',
    cost: 'edit',
    margin: 'edit',
  },
  orderSections: {
    client: 'edit',
    crew: 'edit',
    editing: 'edit',
    payments: 'edit',
  },
};

export const DEFAULT_MANAGER_PERMISSIONS: RolePermissions = {
  destinations: ['Dashboard', 'Orders', 'Assignments', 'Work', 'Packages', 'Activity'],
  money: {
    revenue: 'view',
    cost: 'view',
    margin: 'view',
  },
  orderSections: {
    client: 'edit',
    crew: 'edit',
    editing: 'edit',
    payments: 'view',
  },
};

export const RESTRICTED_MANAGER_PERMISSIONS: RolePermissions = {
  destinations: ['Dashboard', 'Orders'],
  money: {
    revenue: 'none',
    cost: 'none',
    margin: 'none',
  },
  orderSections: {
    client: 'view',
    crew: 'view',
    editing: 'view',
    payments: 'none',
  },
};

export const DEFAULT_EDITOR_PERMISSIONS: RolePermissions = {
  destinations: ['Work', 'Orders', 'Payments'],
  money: {
    revenue: 'none',
    cost: 'none', // Own task cost is handled via self-exception
    margin: 'none',
  },
  orderSections: {
    client: 'none',
    crew: 'none',
    editing: 'view',
    payments: 'none',
  },
};

export const WORK_ONLY_EDITOR_PERMISSIONS: RolePermissions = {
  destinations: ['Work'],
  money: {
    revenue: 'none',
    cost: 'none',
    margin: 'none',
  },
  orderSections: {
    client: 'none',
    crew: 'none',
    editing: 'none',
    payments: 'none',
  },
};

export const AGENT_PERMISSIONS: RolePermissions = {
  destinations: [], // Agents use dedicated Shoots workspace
  money: {
    revenue: 'none',
    cost: 'none', // Own assignment pay via self-exception
    margin: 'none',
  },
  orderSections: {
    client: 'none',
    crew: 'none',
    editing: 'none',
    payments: 'none',
  },
};

/**
 * Resolves effective permissions enforcing the hard margin constraint:
 * Margin is unavailable unless revenue and cost are both at least 'view'.
 */
export function resolveEffectivePermissions(perms: RolePermissions): RolePermissions {
  const canSeeRevenue = perms.money.revenue !== 'none';
  const canSeeCost = perms.money.cost !== 'none';
  const effectiveMargin: PermissionLevel = canSeeRevenue && canSeeCost ? perms.money.margin : 'none';

  return {
    ...perms,
    money: {
      ...perms.money,
      margin: effectiveMargin,
    },
  };
}
