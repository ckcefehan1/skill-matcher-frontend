import { useGetAllSkills } from '@/api/generated/endpoints/skills/skills';
import type { SkillDto } from '@/api/generated/model';
import type { Page } from '@/lib/utils';

export function useSkillCatalog() {
  // ponytail: no unpaged endpoint — fetch first 100, enough for select/datalist
  const query = useGetAllSkills({ pageable: { page: 0, size: 100 } });
  // ponytail: orval typed list GETs as Blob — backend returns Page. Regenerate orval with fixed spec to remove cast.
  const skills = (query.data as unknown as Page<SkillDto> | undefined)?.content;

  return {
    skills,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
