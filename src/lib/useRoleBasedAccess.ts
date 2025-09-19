import { useRole } from '@/lib/useRole';

export function useRoleBasedAccess() {
  const { isAdmin } = useRole();

  return {
    canManageQuestionnaires: isAdmin,
    canManageUsers: isAdmin,
    canExportData: isAdmin,
    canDeleteRecords: isAdmin,
    canEditQuestionnaires: isAdmin,
    canViewAllPatients: isAdmin,
  };
}