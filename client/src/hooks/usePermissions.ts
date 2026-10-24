import { useAuth } from '../context/AuthContext';

/**
 * Single Source of Truth Permission Hook
 * Evaluates effective permissions returned directly from the backend during login/getMe.
 * No permission matrix duplication, no drift, no maintenance overhead.
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  return { can };
};
