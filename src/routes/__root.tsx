import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';

export const rootRoute =
createRootRoute({
    component: () => (
        <QueryClientProvider client=
        {queryClient}>
            <Outlet />
            <Toaster position="bottom-right" />
        </QueryClientProvider>
    ),
    notFoundComponent: () => <div>404 - Seite nicht gefunden</div>,
});