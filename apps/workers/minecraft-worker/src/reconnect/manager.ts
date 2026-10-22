export function createReconnectManager(opts: {
  botId: string;
  maxRetries: number;
  initialDelay: number;
  onReconnect: () => Promise<void>;
}) {
  let retries = 0;
  let timer: NodeJS.Timeout | null = null;
  let cancelled = false;

  return {
    schedule() {
      if (cancelled || retries >= opts.maxRetries) return;
      retries++;
      const delay = Math.min(
        opts.initialDelay * Math.pow(1.5, retries - 1),
        300000
      );
      console.log(`[Reconnect] Bot ${opts.botId} retry ${retries} in ${delay}ms`);
      timer = setTimeout(() => {
        if (!cancelled) opts.onReconnect();
      }, delay);
    },
    cancel() {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
    reset() {
      retries = 0;
      cancelled = false;
    },
  };
}
