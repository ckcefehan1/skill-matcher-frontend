import { createRoute, createRouter, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { authenticatedRoute } from './authenticated';
import { publicRoute } from './public';
import { LoginPage } from '@/features/auth/login-page';
import { PasswordResetPage } from '@/features/auth/password-reset-page';
import { PasswordResetConfirmPage } from '@/features/auth/password-reset-confirm-page';
import { InvitationAcceptPage } from '@/features/auth/invitation-accept-page';
import { ChangePasswordPage } from '@/features/auth/change-password-page';
import { AdminUsersPage } from '@/features/admin/admin-users-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ProjectsPage } from '@/features/projects/projects-page';
import { ProjectDetailPage } from '@/features/projects/project-detail-page';
import { useAuthStore } from '@/stores/auth-store';

// public
const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/login',
  component: LoginPage,
});

const invitationAcceptRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/invitations/accept',
  component: InvitationAcceptPage,
});

const passwordResetRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/password-reset',
  component: PasswordResetPage,
});

const passwordResetConfirmRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/password-reset/confirm',
  component: PasswordResetConfirmPage,
});

// authenticated
const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: DashboardPage,
});

const noAdmin = () => {
  const { user } = useAuthStore.getState();
  if (user?.role === 'ADMIN') {
    throw redirect({ to: '/' });
  }
};

const skillsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/skills',
  beforeLoad: noAdmin,
  component: () => <div>Skills (TODO)</div>,
});

const availabilityRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/availability',
  beforeLoad: noAdmin,
  component: () => <div>Availability (TODO)</div>,
});

const projectsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects',
  component: ProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
});

const matchingRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/matching',
  beforeLoad: noAdmin,
  component: () => <div>Matching (TODO)</div>,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin/users',
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user?.role !== 'ADMIN') {
      throw redirect({ to: '/' });
    }
  },
  component: AdminUsersPage,
});

const changePasswordRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/change-password',
  component: ChangePasswordPage,
});

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([
    loginRoute,
    invitationAcceptRoute,
    passwordResetRoute,
    passwordResetConfirmRoute,
  ]),
  authenticatedRoute.addChildren([
    dashboardRoute,
    skillsRoute,
    availabilityRoute,
    projectsRoute,
    projectDetailRoute,
    matchingRoute,
    adminUsersRoute,
    changePasswordRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}