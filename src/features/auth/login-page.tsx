import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearch } from '@tanstack/react-router';
import { useLogin } from '@/api/generated/endpoints/authentication/authentication';
import { useGetPublicConfig } from '@/api/generated/endpoints/public-config/public-config';
import { PasswordInput } from './password-input';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/stores/auth-store';
import { AuthShell } from './auth-shell';
import { usePageTitle } from '@/lib/use-page-title';
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

const loginSchema = z.object({
  email: z.email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  usePageTitle('Anmelden');
  const navigate = useNavigate();
  const { redirect: redirectTo } = useSearch({ strict: false }) as {
    redirect?: string;
  };
  const storeLogin = useAuthStore((s) => s.login);
  const loginMutation = useLogin();
  const { data: config } = useGetPublicConfig();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          if (!res.user) return;
          const u = res.user;
          storeLogin({
            id: u.id ?? '',
            email: u.email ?? '',
            firstName: u.firstName ?? '',
            lastName: u.lastName ?? '',
            role: (u.role ?? 'EMPLOYER') as User['role'],
          });
          if (redirectTo) {
            navigate({ href: redirectTo });
          } else {
            navigate({ to: '/' });
          }
        },
        onError: (error) => {
          const status = error.response?.status;
          let message = 'Login fehlgeschlagen. Bitte später erneut versuchen.';
          if (status === 401 || status === 403) {
            message = 'E-Mail oder Passwort falsch.';
          } else if (status === 423) {
            message =
              'Konto vorübergehend gesperrt. Bitte in 15 Minuten erneut versuchen.';
          } else if (status === 429) {
            message =
              'Zu viele Versuche. Bitte in einer Minute erneut versuchen.';
          }
          setError('root', { message });
        },
      },
    );
  };

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Anmelden</CardTitle>
          <CardDescription>
            Willkommen zurück. Melde dich mit deinem Account an.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  to="/password-reset"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
      </Card>
      {config?.registrationEnabled ? (
        <p className="text-center text-sm text-muted-foreground">
          Noch kein Firmen-Account?{' '}
          <Link to="/register" className="text-foreground hover:underline">
            Unternehmen registrieren
          </Link>
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Zugang nur per Einladung. Bei Problemen wende dich an deinen
          Administrator.
        </p>
      )}
    </AuthShell>
  );
}
