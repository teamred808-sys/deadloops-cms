import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'visitor_session_id';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function sendPing(pageUrl: string): void {
  const data = JSON.stringify({
    session_id: getOrCreateSessionId(),
    page_url: pageUrl,
    timestamp: new Date().toISOString(),
  });

  // Use sendBeacon for non-blocking, reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      `${API_BASE}/track`,
      new Blob([data], { type: 'application/json' })
    );
  } else {
    // Fallback to fetch with keepalive
    fetch(`${API_BASE}/track`, {
      method: 'POST',
      body: data,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Fire-and-forget: silently fail if server is unavailable
    });
  }
}

/**
 * Lightweight visitor tracking hook.
 * Sends async pings on page load and route changes without blocking render.
 * Uses sendBeacon API for reliable, non-blocking delivery.
 */
export function useVisitorTracking(): void {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;

    // Avoid duplicate pings for same path
    if (lastPath.current === currentPath) return;
    lastPath.current = currentPath;

    // Send ping after a microtask to ensure it doesn't block initial paint
    queueMicrotask(() => {
      sendPing(currentPath);
    });
  }, [location.pathname]);
}
