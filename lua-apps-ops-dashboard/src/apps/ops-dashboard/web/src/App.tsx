import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { lua, LuaApiError } from '@lua-ai-global/app-client';
import { Badge } from '@lua-ai-global/ui/badge';
import { Button } from '@lua-ai-global/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lua-ai-global/ui/card';
import { Input } from '@lua-ai-global/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@lua-ai-global/ui/tabs';

type Status = 'open' | 'closed';
type Priority = 'low' | 'normal' | 'high';

/** The shape `GET /tickets` returns (see `responses` in app.ts). */
interface Ticket {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  createdBy: string;
  createdAt: string;
  closedBy?: string;
  closedAt?: string;
}

const priorityVariant = { low: 'secondary', normal: 'outline', high: 'warning' } as const;

function message(error: unknown): string {
  if (error instanceof LuaApiError) return `${error.message} (${error.status})`;
  return error instanceof Error ? error.message : String(error);
}

export function App() {
  const [status, setStatus] = useState<Status>('open');
  const [tickets, setTickets] = useState<Ticket[]>();
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(undefined);
    lua
      .api<{ items: Ticket[] }>('GET', `/tickets?status=${status}`)
      .then((r) => setTickets(r.items))
      .catch((e) => setError(message(e)));
  }, [status]);
  useEffect(load, [load]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await lua.api<Ticket>('POST', '/tickets', { title, priority });
      setTitle('');
      if (status === 'open') load();
      else setStatus('open');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const close = async (id: string) => {
    try {
      await lua.api('POST', `/tickets/${encodeURIComponent(id)}/close`, {});
      load();
    } catch (e) {
      setError(message(e));
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-lg font-semibold">{lua.appName}</h1>

        <Card>
          <CardHeader>
            <CardTitle>New ticket</CardTitle>
            <CardDescription>It is opened in your name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap gap-2" onSubmit={create}>
              <Input
                className="min-w-48 flex-1"
                placeholder="What needs doing?"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                aria-label="Priority"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
              <Button type="submit" loading={busy} disabled={!title.trim()}>
                Open ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        <Tabs value={status} onValueChange={(value) => setStatus(value as Status)}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!tickets && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {tickets?.length === 0 && <p className="text-sm text-muted-foreground">No {status} tickets.</p>}

        <ul className="space-y-2">
          {tickets?.map((ticket) => (
            <li key={ticket.id}>
              <Card size="sm">
                <CardContent className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.status === 'open'
                        ? `Opened by ${ticket.createdBy}`
                        : `Closed by ${ticket.closedBy ?? 'someone'}`}
                    </p>
                  </div>
                  <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
                  {ticket.status === 'open' && (
                    <Button variant="outline" size="sm" onClick={() => close(ticket.id)}>
                      Close
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
