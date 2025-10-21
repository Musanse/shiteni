type Subscriber = {
  id: string;
  send: (data: string) => void;
};

const channels = new Map<string, Set<Subscriber>>();

export function subscribe(channel: string, id: string, send: (data: string) => void) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  const set = channels.get(channel)!;
  const sub = { id, send };
  set.add(sub);
  return () => {
    set.delete(sub);
    if (set.size === 0) channels.delete(channel);
  };
}

export function publish(channel: string, event: string, payload: any) {
  const set = channels.get(channel);
  if (!set) return;
  const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const sub of set) {
    try { sub.send(data); } catch {}
  }
}


