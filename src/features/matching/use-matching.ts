import { useQueryClient } from '@tanstack/react-query';
import {
  getFindProjectsForMeQueryKey,
  useFindProjectsForMe,
} from '@/api/generated/endpoints/matching/matching';
import {
  getListForProjectQueryKey,
  getListForUserQueryKey,
  useAccept,
  useApply,
  useDecline,
  useListForProject,
  useListForUser,
  useWithdraw,
} from '@/api/generated/endpoints/project-applications/project-applications';
import { getGetMembersQueryKey } from '@/api/generated/endpoints/project-members/project-members';
import { getFindCandidatesQueryKey } from '@/api/generated/endpoints/matching/matching';
import type { ApplicationDto, ProjectMatchDto } from '@/api/generated/model';
import type { Page } from '@/lib/utils';

// ponytail: orval typed list GETs as Blob/single — backend returns lists/pages. Regenerate orval with fixed spec to remove casts.

const MY_MATCHES_PARAMS = { minScore: 0, limit: 50 };
const MY_APPLICATIONS_PARAMS = { pageable: { page: 0, size: 50 } };

export function useEmployeeMatching() {
  const queryClient = useQueryClient();

  const matchesQuery = useFindProjectsForMe(MY_MATCHES_PARAMS);
  const applicationsQuery = useListForUser(MY_APPLICATIONS_PARAMS);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getFindProjectsForMeQueryKey(MY_MATCHES_PARAMS),
    });
    queryClient.invalidateQueries({
      queryKey: getListForUserQueryKey(MY_APPLICATIONS_PARAMS),
    });
  };

  const applyMutation = useApply({ mutation: { onSuccess: invalidate } });
  const withdrawMutation = useWithdraw({
    mutation: { onSuccess: invalidate },
  });

  const applications = (
    applicationsQuery.data as unknown as Page<ApplicationDto> | undefined
  )?.content;

  return {
    matches: matchesQuery.data as unknown as ProjectMatchDto[] | undefined,
    isMatchesLoading: matchesQuery.isLoading,
    applications,
    applyMutation,
    withdrawMutation,
  };
}

const PROJECT_APPLICATIONS_PARAMS = { pageable: { page: 0, size: 50 } };

export function usePmApplications(projectId?: string) {
  const queryClient = useQueryClient();

  const applicationsQuery = useListForProject(
    projectId ?? '',
    PROJECT_APPLICATIONS_PARAMS,
    { query: { enabled: !!projectId } },
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListForProjectQueryKey(
        projectId ?? '',
        PROJECT_APPLICATIONS_PARAMS,
      ),
    });
    queryClient.invalidateQueries({
      queryKey: getGetMembersQueryKey(projectId ?? ''),
    });
    queryClient.invalidateQueries({
      queryKey: getFindCandidatesQueryKey(projectId ?? ''),
    });
  };

  const acceptMutation = useAccept({ mutation: { onSuccess: invalidate } });
  const declineMutation = useDecline({ mutation: { onSuccess: invalidate } });

  return {
    applications: (
      applicationsQuery.data as unknown as Page<ApplicationDto> | undefined
    )?.content,
    isApplicationsLoading: applicationsQuery.isLoading,
    acceptMutation,
    declineMutation,
  };
}
