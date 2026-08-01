import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import {
  useCompleteRegistration,
  useRegisterCompany,
  useResendCode,
  useVerifyCode,
} from '@/api/generated/endpoints/company-registration/company-registration';
import { useGetPublicConfig } from '@/api/generated/endpoints/public-config/public-config';
import { CompanyFormFields } from './company-form-fields';
import {
  companyFormDefaults,
  companySchema,
  toCompanyRequest,
  type CompanyFormValues,
} from './company-form';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/stores/auth-store';
import { passwordSchema } from '@/features/auth/password-schema';
import { PasswordRequirements } from '@/features/auth/password-requirements';
import { PasswordInput } from '@/features/auth/password-input';
import { AuthShell } from '@/features/auth/auth-shell';
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

const accountSchema = z
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

type AccountFormValues = z.infer<typeof accountSchema>;

type Step = 'form' | 'code' | 'account';

export function RegisterCompanyPage() {
  usePageTitle('Unternehmen registrieren');
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);
  const { data: config } = useGetPublicConfig();

  const registerMutation = useRegisterCompany();
  const verifyMutation = useVerifyCode();
  const completeMutation = useCompleteRegistration();
  const resendMutation = useResendCode();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // auto-verify fires once per distinct value, otherwise every typo correction
  // would burn one of the 5 server-side attempts
  const lastVerifiedRef = useRef<string | null>(null);

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: companyFormDefaults,
  });

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  const password = accountForm.watch('password') ?? '';

  const onRegisterSubmit = (values: CompanyFormValues) =>
    registerMutation.mutate(
      { data: toCompanyRequest(values) },
      {
        onSuccess: () => {
          setEmail(values.adminEmail);
          setStep('code');
        },
      },
    );

  const onCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    verifyMutation.reset();
  };

  const verifiedCode = code;
  useEffect(() => {
    if (step !== 'code' || verifiedCode.length !== 6) return;
    if (lastVerifiedRef.current === verifiedCode) return;
    lastVerifiedRef.current = verifiedCode;
    verifyMutation.mutate(
      { data: { email, code: verifiedCode } },
      {
        onSuccess: (res) => {
          if (res.valid) setStep('account');
        },
      },
    );
  }, [step, verifiedCode, email, verifyMutation]);

  const onResend = () =>
    resendMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setCode('');
          lastVerifiedRef.current = null;
          verifyMutation.reset();
        },
      },
    );

  const onAccountSubmit = (values: AccountFormValues) =>
    completeMutation.mutate(
      {
        data: {
          email,
          code,
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

  // on-prem has no self-registration, so a deep link must not show a dead form
  if (config && !config.registrationEnabled) {
    return <Navigate to="/login" />;
  }

  const rateLimited = [registerMutation, verifyMutation, completeMutation].some(
    (m) => m.error?.response?.status === 429,
  );

  return (
    <AuthShell wide>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            {step === 'form' && 'Unternehmen registrieren'}
            {step === 'code' && 'Code eingeben'}
            {step === 'account' && 'Account einrichten'}
          </CardTitle>
          <CardDescription>
            {step === 'form' &&
              'Lege deinen Firmen-Account an. Wir schicken dir einen Code per E-Mail.'}
            {step === 'code' &&
              `Falls wir den Account anlegen konnten, ist eine E-Mail mit einem 6-stelligen Code an ${email} unterwegs.`}
            {step === 'account' && `Richte deinen Account für ${email} ein.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'form' && (
            <form
              onSubmit={companyForm.handleSubmit(onRegisterSubmit)}
              className="flex flex-col gap-4"
            >
              <CompanyFormFields form={companyForm} idPrefix="register" />
              {registerMutation.isError && (
                <p className="text-sm text-destructive">
                  {rateLimited
                    ? 'Zu viele Versuche. Bitte später erneut versuchen.'
                    : 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.'}
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Senden…' : 'Registrieren'}
              </Button>
              <Link
                to="/login"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Zurück zur Anmeldung
              </Link>
            </form>
          )}

          {step === 'code' && (
            <div className="flex flex-col gap-4">
              {/* deliberately neutral: a specific answer would tell an
                  attacker which companies and emails already exist */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="registration-code">6-stelliger Code</Label>
                <Input
                  id="registration-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  aria-invalid={verifyMutation.data?.valid === false}
                  className="tracking-widest"
                />
                {verifyMutation.isPending && (
                  <p className="text-sm text-muted-foreground">Prüfen…</p>
                )}
                {verifyMutation.data?.valid === false && (
                  <p className="text-sm text-destructive">
                    Code ungültig oder abgelaufen.
                  </p>
                )}
                {verifyMutation.isError && (
                  <p className="text-sm text-destructive">
                    {rateLimited
                      ? 'Zu viele Versuche. Bitte später erneut versuchen.'
                      : 'Prüfung fehlgeschlagen. Bitte erneut versuchen.'}
                  </p>
                )}
              </div>
              {resendMutation.isSuccess && (
                <p className="text-sm text-muted-foreground">
                  Falls der Account existiert, ist ein neuer Code unterwegs.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onResend}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending
                  ? 'Senden…'
                  : 'Code erneut senden'}
              </Button>
            </div>
          )}

          {step === 'account' && (
            <form
              onSubmit={accountForm.handleSubmit(onAccountSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  aria-invalid={!!accountForm.formState.errors.firstName}
                  {...accountForm.register('firstName')}
                />
                {accountForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {accountForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={!!accountForm.formState.errors.lastName}
                  {...accountForm.register('lastName')}
                />
                {accountForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {accountForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Passwort</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  aria-invalid={!!accountForm.formState.errors.password}
                  {...accountForm.register('password')}
                />
                {accountForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {accountForm.formState.errors.password.message}
                  </p>
                )}
                <PasswordRequirements password={password} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordConfirm">Passwort wiederholen</Label>
                <PasswordInput
                  id="passwordConfirm"
                  autoComplete="new-password"
                  aria-invalid={!!accountForm.formState.errors.passwordConfirm}
                  {...accountForm.register('passwordConfirm')}
                />
                {accountForm.formState.errors.passwordConfirm && (
                  <p className="text-sm text-destructive">
                    {accountForm.formState.errors.passwordConfirm.message}
                  </p>
                )}
              </div>
              {completeMutation.isError && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-destructive">
                    {rateLimited
                      ? 'Zu viele Versuche. Bitte später erneut versuchen.'
                      : 'Code ungültig oder abgelaufen. Fordere einen neuen Code an.'}
                  </p>
                  {!rateLimited && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCode('');
                        lastVerifiedRef.current = null;
                        verifyMutation.reset();
                        completeMutation.reset();
                        setStep('code');
                      }}
                    >
                      Zurück zur Code-Eingabe
                    </Button>
                  )}
                </div>
              )}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? 'Speichern…' : 'Account erstellen'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
