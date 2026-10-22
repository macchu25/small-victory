'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.update();
          console.log('[PWA] ServiceWorker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker notice:', err);
        });
    }
  }, []);

  return null;
}
