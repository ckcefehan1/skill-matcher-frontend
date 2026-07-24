import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAllProjectsQueryKey,
  getGetProjectQueryKey,
  useCreateProject,
  useUpdateProject,
} from '@/api/generated/endpoints/projects/projects';
import type { ProjectDto } from '@/api/generated/model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_STATUS_LABELS } from '@/lib/utils';

const schema = z
  .object({
    name: z.string().min(1, 'Name erforderlich'),
    description: z.string().min(1, 'Beschreibung erforderlich'),
    startDate: z.string().min(1, 'Startdatum erforderlich'),
    endDate: z.string().min(1, 'Enddatum erforderlich'),
    maxMembers: z.number().int().min(1, 'Mindestens 1 Mitglied'),
    status: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'Enddatum darf nicht vor dem Startdatum liegen',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  maxMembers: 3,
  status: 'PLANNED',
};

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectDto;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: ProjectFormDialogProps) {
  const isEdit = !!project;
  const queryClient = useQueryClient();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name ?? '',
              description: project.description ?? '',
              startDate: project.startDate ?? '',
              endDate: project.endDate ?? '',
              maxMembers: project.maxMembers ?? 3,
              status: project.status ?? 'PLANNED',
            }
          : EMPTY,
      );
    }
  }, [open, project, reset]);

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetAllProjectsQueryKey() });
      if (project?.id) {
        queryClient.invalidateQueries({
          queryKey: getGetProjectQueryKey(project.id),
        });
      }
      onOpenChange(false);
    };
    const onError = (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      setError('root', {
        message:
          status === 403
            ? 'Nur der Projekt-Besitzer darf das.'
            : 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
      });
    };
    if (isEdit) {
      updateMutation.mutate(
        {
          id: project.id ?? '',
          data: {
            name: values.name,
            description: values.description,
            status: values.status ?? 'PLANNED',
            startDate: values.startDate,
            endDate: values.endDate,
            maxMembers: values.maxMembers,
          },
        },
        { onSuccess, onError },
      );
    } else {
      createMutation.mutate(
        {
          data: {
            name: values.name,
            description: values.description,
            startDate: values.startDate,
            endDate: values.endDate,
            maxMembers: values.maxMembers,
          },
        },
        { onSuccess, onError },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Passe die Projektdaten an.'
              : 'Lege ein Projekt mit Zeitraum und Teamgröße an. Skills und Mitglieder pflegst du danach auf der Projektseite.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Beschreibung</Label>
            <Textarea
              id="project-description"
              rows={3}
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-start">Start</Label>
              <Input
                id="project-start"
                type="date"
                aria-invalid={!!errors.startDate}
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-end">Ende</Label>
              <Input
                id="project-end"
                type="date"
                aria-invalid={!!errors.endDate}
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-max">Max. Mitglieder</Label>
              <Input
                id="project-max"
                type="number"
                min={1}
                aria-invalid={!!errors.maxMembers}
                {...register('maxMembers', { valueAsNumber: true })}
              />
              {errors.maxMembers && (
                <p className="text-sm text-destructive">
                  {errors.maxMembers.message}
                </p>
              )}
            </div>
            {isEdit && (
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Speichern…'
                : isEdit
                  ? 'Änderungen speichern'
                  : 'Projekt anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
