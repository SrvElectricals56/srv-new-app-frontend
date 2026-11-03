import { API_BASE_URLS } from './config';

export type RealtimeChangeEvent = {
  id: number;
  type: 'change';
  source: 'admin' | 'mobile';
  scope: string;
  at: string;
};

export function createSseParser(onChange: (event: RealtimeChangeEvent) => void) {
  let buffer = '';

  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (data) {
        try {
          const payload = JSON.parse(data) as Partial<RealtimeChangeEvent>;
          if (payload.type === 'change') onChange(payload as RealtimeChangeEvent);
        } catch {
          // Ignore a malformed event and continue consuming the stream.
        }
      }
      boundary = buffer.indexOf('\n\n');
    }
  };
}

export function connectMobileRealtime(onChange: (event: RealtimeChangeEvent) => void) {
  let stopped = false;
  let controller: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (stopped) return;
    let connected = false;

    for (const baseUrl of API_BASE_URLS) {
      if (stopped) return;
      controller = new AbortController();
      try {
        // Use React Native's built-in fetch so Expo Go does not require the
        // optional ExpoFetchModule native binary. If streaming is unavailable,
        // the existing retry loop yields to normal API refreshes.
        const response = await fetch(`${baseUrl}/realtime/events`, {
          headers: { Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) continue;

        connected = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const parse = createSseParser(onChange);
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          parse(decoder.decode(value, { stream: true }));
        }
        if (!stopped) parse(decoder.decode());
        break;
      } catch (error: any) {
        if (stopped || error?.name === 'AbortError') return;
      }
    }

    if (!stopped) {
      retryTimer = setTimeout(() => { void connect(); }, connected ? 1_000 : 3_000);
    }
  };

  void connect();
  return () => {
    stopped = true;
    controller?.abort();
    if (retryTimer) clearTimeout(retryTimer);
  };
}
