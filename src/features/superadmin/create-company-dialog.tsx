import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getListCompaniesQueryKey,
  useCreateCompany,
} from '@/api/generated/endpoints/superadmin/superadmin';
import { CompanyFormFields } from '@/features/company/company-form-fields';
import {
  companyFormDefaults,
  companySchema,
  toCompanyRequest,
  type CompanyFormValues,
} from '@/features/company/company-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function CreateCompanyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useCreateCompany();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: companyFormDefaults,
  });

  const onSubmit = (values: CompanyFormValues) =>
    mutation.mutate(
      { data: toCompanyRequest(values) },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListCompaniesQueryKey(),
          });
          toast.success('Unternehmen angelegt und Admin eingeladen');
          form.reset();
          onOpenChange(false);
        },
        onError: (error) => {
          form.setError('root', {
            message:
              error.response?.status === 409
                ? 'Firmenname oder E-Mail ist bereits vergeben.'
                : 'Anlegen fehlgeschlagen. Bitte erneut versuchen.',
          });
        },
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unternehmen anlegen</DialogTitle>
          <DialogDescription>
            Das Unternehmen ist sofort aktiv. Die angegebene Person erhält eine
            Einladung als Administrator.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <CompanyFormFields form={form} idPrefix="create-company" />
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Anlegen…' : 'Unternehmen anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
