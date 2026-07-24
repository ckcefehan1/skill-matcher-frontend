import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListUsersQueryKey,
  useCreateUser,
} from '@/api/generated/endpoints/admin/admin';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from './admin-user';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  email: z.email('Ungültige E-Mail-Adresse'),
  role: z.enum(['ADMIN', 'PROJECTMANAGER', 'EMPLOYER']),
});

type FormValues = z.infer<typeof schema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  const mutation = useCreateUser();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'EMPLOYER' },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          const code = error.response?.data?.errorCode;
          setError('root', {
            message:
              code === 'USER_ALREADY_EXISTS'
                ? 'Ein Benutzer mit dieser E-Mail existiert bereits.'
                : 'Einladung fehlgeschlagen. Bitte erneut versuchen.',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Benutzer einladen</DialogTitle>
          <DialogDescription>
            Der Benutzer erhält eine E-Mail mit einem Link zum Einrichten
            seines Accounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">E-Mail</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              placeholder="max.mustermann@firma.de"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rolle</Label>
            <Select
              defaultValue="EMPLOYER"
              onValueChange={(v) => setValue('role', v as FormValues['role'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Senden…' : 'Einladung senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
