import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useChangePassword } from '@/api/generated/endpoints/authentication/authentication';
import { useAuthStore } from '@/stores/auth-store';
import { passwordSchema } from './password-schema';
import { PasswordRequirements } from './password-requirements';
import { PasswordInput } from './password-input';
import { usePageTitle } from '@/lib/use-page-title';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwörter stimmen nicht überein',
  });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordPage() {
  usePageTitle('Passwort ändern');
  const navigate = useNavigate();
  const storeLogout = useAuthStore((s) => s.logout);
  const mutation = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password') ?? '';

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        data: {
          oldPassword: values.oldPassword,
          newPassword: values.password,
        },
      },
      {
        onSuccess: () => {
          // Backend revokes all refresh tokens on password change → re-login required.
          storeLogout();
          navigate({ to: '/login' });
        },
        onError: (error) => {
          const status = error.response?.status;
          setError('root', {
            message:
              status === 401 || status === 403 || status === 400
                ? 'Aktuelles Passwort ist falsch.'
                : 'Passwort konnte nicht geändert werden. Bitte später erneut versuchen.',
          });
        },
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          Passwort ändern
        </h1>
        <p className="text-sm text-muted-foreground">
          Nach der Änderung wirst du automatisch abgemeldet.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="oldPassword">Aktuelles Passwort</Label>
              <PasswordInput
                id="oldPassword"
                autoComplete="current-password"
                aria-invalid={!!errors.oldPassword}
                {...register('oldPassword')}
              />
              {errors.oldPassword && (
                <p className="text-sm text-destructive">
                  {errors.oldPassword.message}
                </p>
              )}
            </div>
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
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Speichern…' : 'Passwort ändern'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
