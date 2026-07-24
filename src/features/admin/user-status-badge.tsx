import type { AdminUserListResponse } from '@/api/generated/model';
import { isUserEnabled } from './admin-user';
import { Badge } from '@/components/ui/badge';

export function UserStatusBadge({ user }: { user: AdminUserListResponse }) {
  if (isUserEnabled(user)) {
    return (
      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700">
        Aktiv
      </Badge>
    );
  }
  if (!user.firstName) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
        Eingeladen
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
      Deaktiviert
    </Badge>
  );
}
