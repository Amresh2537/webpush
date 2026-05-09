import type { Website } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";

export function getInstallSnippet(website: Website) {
  const appUrl = getAppUrl();
  const collectUrl = `${appUrl}/api/collect`;

  return `<script>
  (async function () {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    var websiteId = '${website.id}';
    var websiteDomain = '${website.domain}';
    var collectUrl = '${collectUrl}';
    var vapidPublicKey = '${website.vapidPublicKey}';
    var swConfigQuery =
      '?websiteId=' + encodeURIComponent(websiteId) +
      '&domain=' + encodeURIComponent(websiteDomain) +
      '&collectUrl=' + encodeURIComponent(collectUrl);

    await navigator.serviceWorker.register('/sw.js' + swConfigQuery, { updateViaCache: 'none' });
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const toUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(vapidPublicKey)
    });

    if (registration.active) {
      registration.active.postMessage({
        type: 'NOTIFYFLOW_CONFIG',
        payload: { websiteId, domain: websiteDomain, collectUrl }
      });
    }

    await fetch(collectUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        domain: websiteDomain,
        subscription,
        browser: navigator.userAgent,
        pageUrl: window.location.href,
        location: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
  })();
</script>`;
}
