import { useListUsers } from '@/api/generated/endpoints/admin/admin';
import { useGetAllProjects } from '@/api/generated/endpoints/projects/projects';
import { useGetAllSkills } from '@/api/generated/endpoints/skills/skills';
import { useGetAll } from '@/api/generated/endpoints/my-availability/my-availability';
import { useFindProjectsForMe } from '@/api/generated/endpoints/matching/matching';
import type {
  ProjectDto,
  ProjectMatchDto,
  SkillDto,
  UserAvailabilityDto,
} from '@/api/generated/model';
import { useMySkills } from '@/features/skills/use-my-skills';
import type { AdminUser } from '@/features/admin/admin-user';
import type { Page } from '@/lib/utils';

// ponytail: no filtered count endpoints — fetch first 100, aggregate client-side
// ponytail: orval typed list GETs as Blob/single — backend returns lists/pages. Regenerate orval with fixed spec to remove casts.

export function useAdminDashboardData() {
  const usersQuery = useListUsers({ pageable: { page: 0, size: 100 } });
  const projectsQuery = useGetAllProjects({ pageable: { page: 0, size: 100 } });
  const skillsQuery = useGetAllSkills({ pageable: { page: 0, size: 100 } });

  return {
    users: (usersQuery.data as unknown as Page<AdminUser> | undefined)?.content,
    projects: (projectsQuery.data as unknown as Page<ProjectDto> | undefined)?.content,
    skills: (skillsQuery.data as unknown as Page<SkillDto> | undefined)?.content,
    usersLoading: usersQuery.isLoading,
    projectsLoading: projectsQuery.isLoading,
    skillsLoading: skillsQuery.isLoading,
  };
}

export function usePmDashboardData() {
  const projectsQuery = useGetAllProjects({ pageable: { page: 0, size: 100 } });
  const { skills, isLoading: skillsLoading } = useMySkills();
  const availabilityQuery = useGetAll();

  return {
    projects: (projectsQuery.data as unknown as Page<ProjectDto> | undefined)?.content,
    projectsLoading: projectsQuery.isLoading,
    skills,
    skillsLoading,
    availability: availabilityQuery.data as unknown as
      | UserAvailabilityDto[]
      | undefined,
    availabilityLoading: availabilityQuery.isLoading,
  };
}

export function usePersonalDashboardData() {
  const matchesQuery = useFindProjectsForMe({ minScore: 0, limit: 5 });
  const { skills, isLoading: skillsLoading } = useMySkills();
  const availabilityQuery = useGetAll();

  return {
    matches: matchesQuery.data as unknown as ProjectMatchDto[] | undefined,
    matchesLoading: matchesQuery.isLoading,
    skills,
    skillsLoading,
    availability: availabilityQuery.data as unknown as
      | UserAvailabilityDto[]
      | undefined,
    availabilityLoading: availabilityQuery.isLoading,
  };
}
