export const ROLES = Object.freeze({ FAN: 'fan', STEWARD: 'steward', MANAGER: 'manager', ADMIN: 'admin' });

export function normaliseRole(claimRole) {
  return Object.values(ROLES).includes(claimRole) ? claimRole : ROLES.FAN;
}
export function hasAnyRole(role, allowed) {
  return allowed.includes(normaliseRole(role));
}
