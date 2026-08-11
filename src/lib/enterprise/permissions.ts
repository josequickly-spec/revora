import type { Permission, SystemRole } from "./contracts";

export const rolePermissions: Record<SystemRole, readonly Permission[]> = {
  owner: ["organization.manage","security.manage","crm.read","crm.write","crm.stage.change","billing.read","billing.manage","workflow.read","workflow.manage","api.manage"],
  admin: ["organization.manage","security.manage","crm.read","crm.write","crm.stage.change","billing.read","workflow.read","workflow.manage","api.manage"],
  manager: ["crm.read","crm.write","crm.stage.change","billing.read","workflow.read","workflow.manage"],
  sales: ["crm.read","crm.write","crm.stage.change","workflow.read"],
  marketing: ["crm.read","crm.write","workflow.read"],
  viewer: ["crm.read","billing.read","workflow.read"],
};

export function roleAllows(role: SystemRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
