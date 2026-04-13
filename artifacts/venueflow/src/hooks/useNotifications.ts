import { useState, useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";

export function useNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [lastNotification, setLastNotification] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const enable = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      setPermissionGranted(true);
    }
    return token;
  };

  useEffect(() => {
    if (!permissionGranted) return;
    const unsub = onForegroundMessage((payload: unknown) => {
      const p = payload as { notification?: { title?: string; body?: string } };
      if (p?.notification) {
        setLastNotification({
          title: p.notification.title ?? "VenueFlow Alert",
          body: p.notification.body ?? "",
        });
      }
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [permissionGranted]);

  return { fcmToken, permissionGranted, lastNotification, enable };
}
