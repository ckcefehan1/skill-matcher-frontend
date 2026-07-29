import { useNavigate } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useMarkAllRead,
  useMarkRead,
} from '@/api/generated/endpoints/notifications/notifications';
import type { AppNotification } from '@/features/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notification-store';

export function NotificationBell() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markReadLocal = useNotificationStore((s) => s.markReadLocal);
  const markAllReadLocal = useNotificationStore((s) => s.markAllReadLocal);

  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const onClickNotification = (n: AppNotification) => {
    if (!n.readAt) {
      markReadLocal(n.id);
      markReadMutation.mutate({ id: n.id });
    }
    if (n.type === 'CHAT_MESSAGE') {
      navigate({ to: '/chat' });
    }
  };

  const onMarkAllRead = () => {
    markAllReadLocal();
    markAllReadMutation.mutate(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Benachrichtigungen">
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Benachrichtigungen</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="h-7 gap-1 text-xs">
              <CheckCheck className="size-3.5" aria-hidden />
              Alle gelesen
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Keine Benachrichtigungen.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => onClickNotification(n)}
                className={cn(
                  'flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors hover:bg-accent',
                  !n.readAt && 'bg-primary/5',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm', !n.readAt && 'font-medium')}>
                    {n.title}
                  </span>
                  {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdDate), { addSuffix: true, locale: de })}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
