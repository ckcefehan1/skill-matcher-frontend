import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  useAcceptInvitation,
  useValidateInvitation,
} from '@/api/generated/endpoints/invitation/invitation';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/stores/auth-store';
import { passwordSchema } from './password-schema';
import { PasswordRequirements } from './password-requirements';
import { PasswordInput } from './password-input';
import { AuthShell } from './auth-shell';
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

const schema = z
  .object({
    firstName: z.string().min(1, 'Vorname erforderlich'),
    lastName: z.string().min(1, 'Nachname erforderlich'),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwörter stimmen nicht überein',
  });

type FormValues = z.infer<typeof schema>;

export function InvitationAcceptPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ strict: false }) as { token?: string };
  const storeLogin = useAuthStore((s) => s.login);
  const validateMutation = useValidateInvitation();
  const acceptMutation = useAcceptInvitation();

  const { mutate: validate } = validateMutation;
  useEffect(() => {
    if (token) validate({ data: { token } });
  }, [token, validate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password') ?? '';

  const onSubmit = (values: FormValues) => {
    if (!token) return;
    acceptMutation.mutate(
      {
        data: {
          token,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        },
      },
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
          navigate({ to: '/' });
        },
      },
    );
  };

  const email = validateMutation.data?.email;
  const invalid =
    !token ||
    validateMutation.isError ||
    (validateMutation.isSuccess && !validateMutation.data?.valid);

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Einladung annehmen
          </CardTitle>
          <CardDescription>
            {invalid
              ? 'Diese Einladung ist ungültig oder wurde bereits verwendet.'
              : `Richte deinen Account für ${email ?? '…'} ein.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invalid ? (
            <p className="text-sm text-muted-foreground">
              Wende dich an deinen Administrator für eine neue Einladung.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Passwort</Label>
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
              {acceptMutation.isError && (
                <p className="text-sm text-destructive">
                  Einladung konnte nicht angenommen werden. Bitte erneut
                  versuchen.
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={acceptMutation.isPending || validateMutation.isPending}
              >
                {acceptMutation.isPending
                  ? 'Speichern…'
                  : 'Account erstellen'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
