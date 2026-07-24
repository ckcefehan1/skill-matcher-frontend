import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAllProjectsQueryKey,
  getGetProjectQueryKey,
  useDeleteProject,
  useGetProject,
} from '@/api/generated/endpoints/projects/projects';
import {
  getGetProjectSkillsQueryKey,
  useAddSkill,
  useDelete1,
  useGetProjectSkills,
} from '@/api/generated/endpoints/project-skills/project-skills';
import {
  getGetMembersQueryKey,
  useAddMember,
  useGetMembers,
  useLeaveProject,
  useRemoveMember,
} from '@/api/generated/endpoints/project-members/project-members';
import {
  getFindCandidatesQueryKey,
  useFindCandidates,
} from '@/api/generated/endpoints/matching/matching';
import type {
  ProjectMemberDto,
  ProjectSkillDto,
  UserMatchDto,
} from '@/api/generated/model';

// ponytail: orval typed list GETs as Blob/single — backend returns lists. Regenerate orval with fixed spec to remove casts.

// skills/candidates endpoints are PROJECTMANAGER-only server-side — queries stay disabled for other roles
export function useProjectDetail(projectId: string, { isPM }: { isPM: boolean }) {
  const queryClient = useQueryClient();

  const projectQuery = useGetProject(projectId);
  const membersQuery = useGetMembers(projectId);
  const skillsQuery = useGetProjectSkills(projectId, {
    query: { enabled: isPM },
  });
  const candidatesQuery = useFindCandidates(
    projectId,
    { minScore: 0, limit: 10 },
    { query: { enabled: isPM } },
  );

  const invalidateSkillsAndCandidates = () => {
    queryClient.invalidateQueries({
      queryKey: getGetProjectSkillsQueryKey(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: getFindCandidatesQueryKey(projectId),
    });
  };
  const invalidateMembers = () =>
    queryClient.invalidateQueries({
      queryKey: getGetMembersQueryKey(projectId),
    });
  const invalidateMembersAndCandidates = () => {
    invalidateMembers();
    queryClient.invalidateQueries({
      queryKey: getFindCandidatesQueryKey(projectId),
    });
  };

  const addSkillMutation = useAddSkill({
    mutation: { onSuccess: invalidateSkillsAndCandidates },
  });
  const deleteSkillMutation = useDelete1({
    mutation: { onSuccess: invalidateSkillsAndCandidates },
  });
  const addMemberMutation = useAddMember({
    mutation: { onSuccess: invalidateMembersAndCandidates },
  });
  const removeMemberMutation = useRemoveMember({
    mutation: { onSuccess: invalidateMembers },
  });
  const leaveProjectMutation = useLeaveProject({
    mutation: { onSuccess: invalidateMembers },
  });
  const deleteProjectMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAllProjectsQueryKey(),
        });
        queryClient.removeQueries({ queryKey: getGetProjectQueryKey(projectId) });
      },
    },
  });

  return {
    project: projectQuery.data,
    isProjectLoading: projectQuery.isLoading,
    members: membersQuery.data as unknown as ProjectMemberDto[] | undefined,
    isMembersLoading: membersQuery.isLoading,
    skills: skillsQuery.data as unknown as ProjectSkillDto[] | undefined,
    isSkillsLoading: skillsQuery.isLoading,
    candidates: candidatesQuery.data as unknown as UserMatchDto[] | undefined,
    isCandidatesLoading: candidatesQuery.isLoading,
    addSkillMutation,
    deleteSkillMutation,
    addMemberMutation,
    removeMemberMutation,
    leaveProjectMutation,
    deleteProjectMutation,
  };
}
