'use client';

import { useEffect } from 'react';

/** Registers the service worker so the app can be installed as a PWA. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
