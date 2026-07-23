import { Check, X } from 'lucide-react';

const rules: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: 'Mindestens 8 Zeichen', test: (p) => p.length >= 8 },
  { label: 'Großbuchstabe (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Kleinbuchstabe (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Ziffer (0–9)', test: (p) => /[0-9]/.test(p) },
  { label: 'Sonderzeichen (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {rules.map(({ label, test }) => {
        const ok = password.length > 0 && test(password);
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-xs ${
              ok ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            {ok ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <X className="size-3" aria-hidden />
            )}
            {label}
          </li>
        );
      })}
    </ul>
  );
}
