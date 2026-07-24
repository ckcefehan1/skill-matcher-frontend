import { useQueryClient } from '@tanstack/react-query';
import {
  getListUsersQueryKey,
  useListUsers,
  useResendInvitation,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/api/generated/endpoints/admin/admin';
import type { AdminUser } from './admin-user';
import type { Page } from '@/lib/utils';

export function useAdminUsers() {
  const queryClient = useQueryClient();

  // ponytail: fetch first 100, filter/sort client-side — switch to server-side params when user count grows
  const query = useListUsers({ pageable: { page: 0, size: 100 } });
  // ponytail: orval typed list GETs as Blob/single — backend returns Page. Regenerate orval with fixed spec to remove cast.
  const users = (query.data as unknown as Page<AdminUser> | undefined)?.content;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const roleMutation = useUpdateUserRole({ mutation: { onSuccess: invalidate } });
  const statusMutation = useUpdateUserStatus({
    mutation: { onSuccess: invalidate },
  });
  const resendMutation = useResendInvitation();

  return {
    users,
    isLoading: query.isLoading,
    roleMutation,
    statusMutation,
    resendMutation,
  };
}
