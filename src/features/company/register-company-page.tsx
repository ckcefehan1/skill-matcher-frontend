import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { MailOpen } from 'lucide-react';
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

const CODE_LENGTH = 6;
// mirrors invitation.resend-cooldown-seconds — the server silently drops resends
// inside that window, so without the countdown the button would claim a mail it
// never sent
const RESEND_COOLDOWN_SECONDS = 60;

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
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join('');
  // auto-verify fires once per distinct value, otherwise every typo correction
  // would burn one of the 5 server-side attempts
  const lastVerifiedRef = useRef<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // dropping the mutation result without dropping the guard would leave a code the
  // user already tried unverifiable — deleting a digit and retyping it does nothing
  const clearVerifyResult = () => {
    lastVerifiedRef.current = null;
    verifyMutation.reset();
  };

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
          setResendIn(RESEND_COOLDOWN_SECONDS);
        },
      },
    );

  const onDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      // autofill (one-time-code) and paste deliver the whole code at once
      setDigits(Array.from({ length: CODE_LENGTH }, (_, i) => cleaned[i] ?? ''));
      clearVerifyResult();
      digitRefs.current[Math.min(cleaned.length, CODE_LENGTH) - 1]?.focus();
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    clearVerifyResult();
    if (cleaned && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const onDigitKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      clearVerifyResult();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const resetCode = () => {
    setDigits(Array(CODE_LENGTH).fill(''));
    clearVerifyResult();
    digitRefs.current[0]?.focus();
  };

  useEffect(() => {
    if (step !== 'code' || code.length !== CODE_LENGTH) return;
    if (lastVerifiedRef.current === code) return;
    lastVerifiedRef.current = code;
    verifyMutation.mutate(
      { data: { email, code } },
      {
        onSuccess: (res) => {
          if (res.valid) setStep('account');
        },
      },
    );
  }, [step, code, email, verifyMutation]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const onResend = () =>
    resendMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          resetCode();
          setResendIn(RESEND_COOLDOWN_SECONDS);
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

  const rateLimited = [
    registerMutation,
    verifyMutation,
    completeMutation,
    resendMutation,
  ].some((m) => m.error?.response?.status === 429);

  // a rejected code is the one complete error the user can act on, everything else
  // (password rules, server trouble) must not send them back to the code step
  const codeRejected =
    completeMutation.error?.response?.data?.errorCode ===
    'INVALID_REGISTRATION_CODE';

  return (
    <AuthShell wide>
      <Card>
        <CardHeader className={step === 'code' ? 'text-center' : undefined}>
          {step === 'code' && (
            <MailOpen
              className="mx-auto h-10 w-10 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
          <CardTitle className="text-xl tracking-tight">
            {step === 'form' && 'Unternehmen registrieren'}
            {step === 'code' && 'Code eingeben'}
            {step === 'account' && 'Account einrichten'}
          </CardTitle>
          <CardDescription>
            {step === 'form' &&
              'Lege deinen Firmen-Account an. Wir schicken dir einen Code per E-Mail.'}
            {step === 'code' &&
              `Wir haben einen 6-stelligen Code an ${email} gesendet.`}
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
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex justify-center gap-3"
                  role="group"
                  aria-label="6-stelliger Code"
                >
                  {digits.map((digit, i) => (
                    <Input
                      key={i}
                      ref={(el) => {
                        digitRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      autoFocus={i === 0}
                      value={digit}
                      onChange={(e) => onDigitChange(i, e.target.value)}
                      onKeyDown={(e) => onDigitKeyDown(i, e)}
                      aria-label={`Ziffer ${i + 1}`}
                      aria-invalid={verifyMutation.data?.valid === false}
                      className="h-14 w-12 text-center text-xl"
                    />
                  ))}
                </div>
                {(verifyMutation.isPending ||
                  verifyMutation.data?.valid === false ||
                  verifyMutation.isError ||
                  resendMutation.isError ||
                  resendMutation.isSuccess) && (
                  <div className="flex items-center justify-center">
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
                    {resendMutation.isError && (
                      <p className="text-sm text-destructive">
                        {rateLimited
                          ? 'Zu viele Versuche. Bitte später erneut versuchen.'
                          : 'Senden fehlgeschlagen. Bitte erneut versuchen.'}
                      </p>
                    )}
                    {resendMutation.isSuccess && !verifyMutation.isPending && (
                      <p className="text-sm text-muted-foreground">
                        Neuer Code gesendet.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onResend}
                disabled={resendMutation.isPending || resendIn > 0}
              >
                {resendMutation.isPending
                  ? 'Senden…'
                  : resendIn > 0
                    ? `Code erneut senden (${resendIn}s)`
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
                      : codeRejected
                        ? 'Code ungültig oder abgelaufen. Fordere einen neuen Code an.'
                        : 'Registrierung fehlgeschlagen. Bitte Eingaben prüfen.'}
                  </p>
                  {codeRejected && !rateLimited && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetCode();
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
