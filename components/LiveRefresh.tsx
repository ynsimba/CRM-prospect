"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresh({
  intervalMs = 5000,
  label = "Suivi en temps réel",
}: {
  intervalMs?: number;
  label?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const timer = window.setInterval(refresh, intervalMs);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [intervalMs, router]);

  return (
    <p className="live-badge" aria-live="polite">
      <span className="live-dot" aria-hidden />
      {label}
    </p>
  );
}
