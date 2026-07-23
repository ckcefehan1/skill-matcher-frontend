import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearch } from '@tanstack/react-router';
import { useLogin } from '@/api/generated/endpoints/authentication/authentication';
import { PasswordInput } from './password-input';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/stores/auth-store';
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

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-primary md:flex md:flex-col md:justify-between md:p-10 lg:p-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(1 0 0 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.35) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative flex items-center gap-2 text-primary-foreground">
        <div className="size-2 rounded-full bg-primary-foreground" />
        <span className="text-sm font-medium tracking-tight">Skill Matcher</span>
      </div>
      <div className="relative flex flex-col gap-8">
        <p className="max-w-md text-3xl font-medium leading-tight tracking-tight text-primary-foreground lg:text-4xl">
          Die richtigen Leute für das richtige Projekt.
        </p>
        <div className="flex max-w-sm flex-col gap-3">
          {[
            { name: 'Anna Keller', skill: 'TypeScript', score: 92 },
            { name: 'Jonas Weber', skill: 'Kubernetes', score: 78 },
            { name: 'Mira Lang', skill: 'Produktdesign', score: 64 },
          ].map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 backdrop-blur-sm"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-medium text-primary-foreground">
                {m.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary-foreground">
                  {m.name}
                </span>
                <span className="truncate text-xs text-primary-foreground/70">
                  {m.skill}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-16 overflow-hidden rounded-full bg-primary-foreground/20">
                  <div
                    className="h-full rounded-full bg-primary-foreground"
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium tabular-nums text-primary-foreground">
                  {m.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="relative text-xs text-primary-foreground/60">
        Internes Planungstool
      </p>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = useSearch({ strict: false }) as {
    redirect?: string;
  };
  const storeLogin = useAuthStore((s) => s.login);
  const loginMutation = useLogin();

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
          if (!res.accessToken || !res.refreshToken || !res.user) return;
          const u = res.user;
          storeLogin(res.accessToken, res.refreshToken, {
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
          setError('root', {
            message:
              status === 401 || status === 403
                ? 'E-Mail oder Passwort falsch.'
                : 'Login fehlgeschlagen. Bitte später erneut versuchen.',
          });
        },
      },
    );
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <BrandPanel />
      <div className="relative flex flex-col bg-muted/50">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(oklch(0.145 0 0 / 0.10) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex items-center justify-between p-6 md:p-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-sm font-medium tracking-tight">
              Skill Matcher
            </span>
          </div>
          <span className="hidden md:block" />
          <a
            href="mailto:support@example.com"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Hilfe?
          </a>
        </div>
        <div className="relative flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">
                  Anmelden
                </CardTitle>
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
                    <p className="text-sm text-destructive">
                      {errors.root.message}
                    </p>
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
            <p className="px-2 text-center text-xs text-muted-foreground">
              Zugang nur per Einladung. Bei Problemen wende dich an deinen
              Administrator.
            </p>
          </div>
        </div>
        <div className="relative flex items-center justify-center gap-4 p-6 text-xs text-muted-foreground md:p-8">
          <span>Datenschutz</span>
          <span aria-hidden>·</span>
          <span>Impressum</span>
          <span aria-hidden>·</span>
          <span>v0.1</span>
        </div>
      </div>
    </div>
  );
}
