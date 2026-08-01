import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getListCompaniesQueryKey,
  useListCompanies,
  useUpdateCompanyStatus,
} from '@/api/generated/endpoints/superadmin/superadmin';
import { CreateCompanyDialog } from './create-company-dialog';
import { COMPANY_SIZE_LABELS } from '@/features/company/company-form';
import { QueryError } from '@/components/query-error';
import { usePageTitle } from '@/lib/use-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function SuperadminCompaniesPage() {
  usePageTitle('Unternehmen');
  const queryClient = useQueryClient();
  const query = useListCompanies();
  const companies = query.data;

  const statusMutation = useUpdateCompanyStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        toast.success('Status aktualisiert');
      },
      onError: () => toast.error('Status konnte nicht geändert werden'),
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = (companies ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Unternehmen</h1>
          <p className="text-sm text-muted-foreground">
            {companies
              ? `${filtered.length} von ${companies.length} Unternehmen`
              : ' '}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Building2 className="size-4" aria-hidden />
          Unternehmen anlegen
        </Button>
      </div>

      <Input
        placeholder="Name oder Ort suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />

      <div className="rounded-lg border bg-card">
        {query.isError ? (
          <QueryError onRetry={() => query.refetch()} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Angelegt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.zip} {c.city}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.companySize
                      ? COMPANY_SIZE_LABELS[
                          c.companySize as keyof typeof COMPANY_SIZE_LABELS
                        ]
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!c.enabled}
                        disabled={
                          statusMutation.isPending &&
                          statusMutation.variables?.companyId === c.id
                        }
                        onCheckedChange={(enabled) =>
                          statusMutation.mutate({
                            companyId: c.id!,
                            data: { enabled },
                          })
                        }
                        aria-label="Aktiv-Status"
                      />
                      {c.enabled ? (
                        <Badge
                          variant="outline"
                          className="border-green-500/30 bg-green-500/10 text-green-700"
                        >
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-700"
                        >
                          Nicht freigeschaltet
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {c.createdDate
                      ? new Date(c.createdDate).toLocaleDateString('de-DE')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {companies && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {companies.length === 0
                      ? 'Noch keine Unternehmen. Lege das erste an.'
                      : 'Keine Unternehmen für diese Suche.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
