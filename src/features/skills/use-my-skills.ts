import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGetMySkillsQueryKey,
  useAddSkill1,
  useDelete2,
  useGetMySkills,
} from '@/api/generated/endpoints/my-skills/my-skills';
import type { UserSkillDto } from '@/api/generated/model';

export function useMySkills() {
  const queryClient = useQueryClient();

  const query = useGetMySkills();
  // ponytail: orval typed list GETs as Blob — backend returns a list. Regenerate orval with fixed spec to remove cast.
  const skills = query.data as unknown as UserSkillDto[] | undefined;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetMySkillsQueryKey() });

  const addMutation = useAddSkill1({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Skill gespeichert');
      },
      onError: () => toast.error('Skill konnte nicht hinzugefügt werden'),
    },
  });
  const deleteMutation = useDelete2({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Skill entfernt');
      },
      onError: () => toast.error('Skill konnte nicht entfernt werden'),
    },
  });

  return {
    skills,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    addMutation,
    deleteMutation,
  };
}
