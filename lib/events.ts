/**
 * In-process event bus used by the messaging SSE stream.
 *
 * A single Next.js Node server is the default deployment target, so an
 * in-memory bus is sufficient and avoids an extra infrastructure dependency.
 * For multi-instance deployments set REDIS_URL and swap this module for a
 * Redis pub/sub adapter (the exported API is intentionally tiny).
 */

export type StreamEvent =
  | { type: "message"; conversationId: string; messageId: string; senderId: string; preview: string }
  | { type: "read"; conversationId: string; userId: string }
  | { type: "notification"; notificationId: string; title: string }
  | { type: "ping" };

type Listener = (event: StreamEvent) => void;

const globalForBus = globalThis as unknown as {
  __cnBus?: Map<string, Set<Listener>>;
};

const listeners = (globalForBus.__cnBus ??= new Map<string, Set<Listener>>());

export function subscribe(userId: string, listener: Listener) {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(listener);

  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(userId);
  };
}

export function publish(userIds: string[], event: StreamEvent) {
  for (const userId of new Set(userIds)) {
    const set = listeners.get(userId);
    if (!set) continue;
    for (const listener of set) {
      try {
        listener(event);
      } catch {
        // A broken stream must not break the publisher.
      }
    }
  }
}
