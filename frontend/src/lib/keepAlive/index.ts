// Keep backend warm by pinging health endpoint every 4 minutes
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

let intervalId: NodeJS.Timeout | null = null;

export function startKeepAlive() {
  if (typeof window === 'undefined' || !API_URL) return;

  // Clear existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Ping immediately
  pingBackend();

  // Then ping every 4 minutes
  intervalId = setInterval(pingBackend, PING_INTERVAL);
}

export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function pingBackend() {
  try {
    await fetch(`${API_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    console.log('[KeepAlive] Backend pinged successfully');
  } catch (error) {
    console.warn('[KeepAlive] Failed to ping backend:', error);
  }
}
