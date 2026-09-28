"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type TopbarGroup = {
  title: string;
  icon: string;
  items: { key: string; href: string; label: string }[];
};

/** Horizontal module bar: one disclosure button per group, each opening its submenu. */
export default function CockpitTopbar({ label, active, groups }: { label: string; active: string; groups: TopbarGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const baseId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      buttonRefs.current.get(open)?.focus();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav ref={barRef} className="cockpit-topbar" aria-label={label}>
      <span className="cockpit-topbar-title">{label}</span>
      <ul className="cockpit-topbar-list">
        {groups.map((group) => {
          const isOpen = open === group.title;
          const isCurrent = group.items.some((item) => item.key === active);
          const menuId = `${baseId}-${group.title}`;
          return (
            <li key={group.title} className="cockpit-topbar-group">
              <button
                ref={(node) => {
                  if (node) buttonRefs.current.set(group.title, node);
                }}
                type="button"
                className={`cockpit-topbar-item ${isCurrent ? "active" : ""} ${isOpen ? "is-open" : ""}`}
                aria-expanded={isOpen}
                aria-controls={menuId}
                onClick={() => setOpen(isOpen ? null : group.title)}
              >
                <i className={`bi ${group.icon}`} aria-hidden /> {group.title}
                <i className="bi bi-chevron-down cockpit-topbar-caret" aria-hidden />
              </button>
              <ul id={menuId} className="cockpit-submenu" hidden={!isOpen}>
                {group.items.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={`cockpit-submenu-link ${active === item.key ? "active" : ""}`}
                      aria-current={active === item.key ? "page" : undefined}
                      onClick={() => setOpen(null)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
