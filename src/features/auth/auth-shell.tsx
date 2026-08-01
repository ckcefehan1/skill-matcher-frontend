import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export function AuthShell({
  children,
  wide,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        className={cn(
          'flex w-full flex-col gap-6',
          wide ? 'max-w-md' : 'max-w-sm',
        )}
      >
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
