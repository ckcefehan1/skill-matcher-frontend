import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from '@tanstack/react-router';
import { useRequestPasswordReset } from '@/api/generated/endpoints/password-reset/password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const schema = z.object({
  email: z.email('Ungültige E-Mail-Adresse'),
});

type FormValues = z.infer<typeof schema>;

export function PasswordResetPage() {
  const mutation = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ data: values });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Passwort zurücksetzen
          </CardTitle>
          <CardDescription>
            Wir senden dir einen Link zum Zurücksetzen per E-Mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mutation.isSuccess ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen
                Link zum Zurücksetzen geschickt.
              </p>
              <Link to="/login" className="text-sm hover:underline">
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {mutation.isError && (
                <p className="text-sm text-destructive">
                  Anfrage fehlgeschlagen. Bitte später erneut versuchen.
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Senden…' : 'Link senden'}
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
    </div>
  );
}
