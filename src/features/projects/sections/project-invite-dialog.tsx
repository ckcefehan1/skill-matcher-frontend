import { useState } from 'react';
import { usePmApplications } from '@/features/matching/use-matching';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProjectInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string;
  userName: string;
}

export function ProjectInviteDialog({
  open,
  onOpenChange,
  projectId,
  userId,
  userName,
}: ProjectInviteDialogProps) {
  const { inviteMutation } = usePmApplications(projectId);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    inviteMutation.mutate(
      { projectId, data: { userId, message: message || undefined } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => {
          const status = (e as { response?: { status?: number } })?.response
            ?.status;
          setError(
            status === 409
              ? 'Es gibt bereits eine offene Bewerbung oder Einladung für diese Person.'
              : 'Einladung fehlgeschlagen. Bitte erneut versuchen.',
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userName} einladen</DialogTitle>
          <DialogDescription>
            Die Person erhält eine Einladung und wird nach Annahme direkt
            Mitglied des Projekts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-message">Nachricht (optional)</Label>
          <Textarea
            id="invite-message"
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={submit} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Senden…' : 'Einladung senden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
