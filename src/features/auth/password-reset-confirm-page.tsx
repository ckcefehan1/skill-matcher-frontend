import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useResetPassword } from '@/api/generated/endpoints/password-reset/password-reset';
import { AuthShell } from './auth-shell';
import { passwordSchema } from './password-schema';
import { PasswordRequirements } from './password-requirements';
import { PasswordInput } from './password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const schema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwörter stimmen nicht überein',
  });

type FormValues = z.infer<typeof schema>;

export function PasswordResetConfirmPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ strict: false }) as { token?: string };
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password') ?? '';

  if (!token) {
    return (
      <AuthShell>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">
              Ungültiger Link
            </CardTitle>
            <CardDescription>
              Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/password-reset" className="text-sm hover:underline">
              Neuen Link anfordern
            </Link>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      { data: { token, newPassword: values.password } },
      {
        onSuccess: () => navigate({ to: '/login' }),
      },
    );
  };

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Neues Passwort setzen
          </CardTitle>
          <CardDescription>
            Wähle ein neues Passwort für deinen Account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <PasswordRequirements password={password} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="passwordConfirm">Passwort wiederholen</Label>
              <PasswordInput
                id="passwordConfirm"
                autoComplete="new-password"
                aria-invalid={!!errors.passwordConfirm}
                {...register('passwordConfirm')}
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-destructive">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>
            {mutation.isError && (
              <p className="text-sm text-destructive">
                Zurücksetzen fehlgeschlagen. Der Link ist vermutlich abgelaufen
                — fordere einen neuen an.
              </p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Speichern…' : 'Passwort setzen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
