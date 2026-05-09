import type { Website } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";

export function getInstallSnippet(website: Website) {
  const appUrl = getAppUrl();

  return `<script>
  (async function () {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const toUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array('${website.vapidPublicKey}')
    });

    await fetch('${appUrl}/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId: '${website.id}',
        domain: '${website.domain}',
        subscription,
        browser: navigator.userAgent,
        pageUrl: window.location.href,
        location: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
  })();
</script>`;
}
