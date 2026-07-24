import type { AdminUserListResponse } from '@/api/generated/model';

// Backend serializes Kotlin `isEnabled` with the prefix; the orval type lacks it.
export type AdminUser = AdminUserListResponse & { isEnabled?: boolean };

export const isUserEnabled = (u: AdminUser): boolean =>
  u.isEnabled ?? u.enabled ?? false;
