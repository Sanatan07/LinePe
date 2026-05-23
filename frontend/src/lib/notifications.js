export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

export const showBrowserNotification = (title, body, { icon, tag } = {}) => {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // Only fire when the tab is hidden — the in-app toast covers the visible case.
  if (!document.hidden) return;

  const n = new Notification(title, {
    body,
    icon: icon || "/favicon.ico",
    tag, // deduplicates per-conversation so rapid messages don't stack
  });

  n.onclick = () => {
    window.focus();
    n.close();
  };
};
