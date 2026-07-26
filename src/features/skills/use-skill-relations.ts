import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getListBySkillQueryKey,
  useCreate1,
  useDelete3,
  useListBySkill,
} from '@/api/generated/endpoints/skill-relations/skill-relations';
import type { SkillRelationDto } from '@/api/generated/model';

export function useSkillRelations(skillId?: string) {
  const queryClient = useQueryClient();

  const query = useListBySkill(
    { skillId: skillId ?? '' },
    { query: { enabled: !!skillId } },
  );
  const relations = query.data as unknown as SkillRelationDto[] | undefined;

  // base key matches all listBySkill variants by prefix
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListBySkillQueryKey() });

  const createMutation = useCreate1({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Relation angelegt');
      },
      onError: () => toast.error('Relation konnte nicht angelegt werden'),
    },
  });
  const deleteMutation = useDelete3({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success('Relation gelöscht');
      },
      onError: () => toast.error('Relation konnte nicht gelöscht werden'),
    },
  });

  return {
    relations,
    isLoading: !!skillId && query.isLoading,
    createMutation,
    deleteMutation,
  };
}
