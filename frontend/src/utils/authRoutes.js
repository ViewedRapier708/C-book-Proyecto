export const SUPPORT_ROLES = ['support_admin', 'support_agent'];

export function isSupportRole(role) {
  return SUPPORT_ROLES.includes(role);
}

export function isSupportAdmin(role) {
  return role === 'support_admin';
}

export function getHomePath(user) {
  if (!user) return '/';
  if (user.rol === 'Admin') return '/admin';
  if (isSupportRole(user.rol)) return '/soporte';
  return '/user';
}
