export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    STOREKEEPER: 'STOREKEEPER',
    SALESPERSON: 'SALESPERSON',
};

export function getDashboardPath(role) {
  // Keeping one dashboard route lets the page render role-specific content
  // without duplicating the application shell.
    return '/dashboard';
}
