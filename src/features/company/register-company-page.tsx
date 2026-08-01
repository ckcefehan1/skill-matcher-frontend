import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from '@tanstack/react-router';
import { useRegisterCompany } from '@/api/generated/endpoints/company-registration/company-registration';
import { useGetPublicConfig } from '@/api/generated/endpoints/public-config/public-config';
import { CompanyFormFields } from './company-form-fields';
import {
  companyFormDefaults,
  companySchema,
  toCompanyRequest,
  type CompanyFormValues,
} from './company-form';
import { AuthShell } from '@/features/auth/auth-shell';
import { usePageTitle } from '@/lib/use-page-title';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function RegisterCompanyPage() {
  usePageTitle('Unternehmen registrieren');
  const mutation = useRegisterCompany();
  const { data: config } = useGetPublicConfig();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: companyFormDefaults,
  });

  const onSubmit = (values: CompanyFormValues) =>
    mutation.mutate({ data: toCompanyRequest(values) });

  // on-prem has no self-registration, so a deep link must not show a dead form
  if (config && !config.registrationEnabled) {
    return <Navigate to="/login" />;
  }

  return (
    <AuthShell wide>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Unternehmen registrieren
          </CardTitle>
          <CardDescription>
            Lege deinen Firmen-Account an. Wir schicken dir eine E-Mail zum
            Freischalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mutation.isSuccess ? (
            <div className="flex flex-col gap-4">
              {/* deliberately neutral: a specific answer would tell an
                  attacker which companies and emails already exist */}
              <p className="text-sm text-muted-foreground">
                Danke. Falls wir den Account anlegen konnten, ist eine E-Mail
                mit dem Einrichtungslink unterwegs.
              </p>
              <Link to="/login" className="text-sm hover:underline">
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <CompanyFormFields form={form} idPrefix="register" />
              {mutation.isError && (
                <p className="text-sm text-destructive">
                  {mutation.error?.response?.status === 429
                    ? 'Zu viele Versuche. Bitte später erneut versuchen.'
                    : 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.'}
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Senden…' : 'Registrieren'}
              </Button>
              <Link
                to="/login"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Zurück zur Anmeldung
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
