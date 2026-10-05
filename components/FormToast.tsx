"use client";

import { useEffect, useState } from "react";

export default function FormToast({
  message,
  tone = "success",
}: {
  message?: string;
  tone?: "success" | "error";
}) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!message) return;
    setText(message);
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!visible || !text) return null;

  return (
    <div className={`app-toast is-${tone}`} role="status" aria-live="polite">
      <i className={`bi ${tone === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} aria-hidden />
      <span>{text}</span>
      <button type="button" className="app-toast-close" aria-label="Fermer" onClick={() => setVisible(false)}>
        <i className="bi bi-x" aria-hidden />
      </button>
    </div>
  );
}
