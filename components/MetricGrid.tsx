"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import CountUp from "./CountUp";
import { getDashboardKpiDetailsAction } from "@/app/actions/dashboard";
import { DASHBOARD_KPI_DETAIL_LIMIT, dashboardKpiHeading, isCommentableDashboardKpi } from "@/lib/dashboard-logic";
import type { DashboardKpi, DashboardKpiDetailRow } from "@/lib/dashboard-logic";
import RelanceKpiTable from "./RelanceKpiTable";

const noopSubscribe = () => () => {};

const TONE_ICON: Record<DashboardKpi["tone"], string> = {
  orange: "bi-lightning-charge",
  navy: "bi-moon-stars",
  blue: "bi-funnel",
  green: "bi-check2-circle",
  red: "bi-exclamation-triangle",
  urgent: "bi-bell",
  brand: "bi-people",
};

type MetricGridProps = {
  metrics: DashboardKpi[];
  variant?: "filled" | "summary" | "tasks";
};

export default function MetricGrid({ metrics, variant = "filled" }: MetricGridProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestId = useRef(0);
  // true on the client only, so the portal never renders during SSR.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [open, setOpen] = useState<DashboardKpi | null>(null);
  const [items, setItems] = useState<DashboardKpiDetailRow[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    requestId.current += 1;
    setOpen(null);
    setItems([]);
    setTruncated(false);
    setError("");
    setLoading(false);
  };

  function openMetric(metric: DashboardKpi) {
    setOpen(metric);
    setItems([]);
    setTruncated(false);
    setError("");
    setLoading(true);
  }

  async function reloadDetails(kpiId: string) {
    const result = await getDashboardKpiDetailsAction(kpiId);
    setItems(result.items);
    setTruncated(result.truncated);
  }

  useEffect(() => {
    if (!open?.id) return;

    const current = ++requestId.current;
    void getDashboardKpiDetailsAction(open.id)
      .then((result) => {
        if (current !== requestId.current) return;
        setItems(result.items);
        setTruncated(result.truncated);
      })
      .catch(() => {
        if (current !== requestId.current) return;
        setError("Impossible de charger le détail.");
        setItems([]);
        setTruncated(false);
      })
      .finally(() => {
        if (current !== requestId.current) return;
        setLoading(false);
      });
  }, [open?.id]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const gridClass =
    variant === "summary" ? "metric-grid metric-grid-summary" : variant === "tasks" ? "metric-grid metric-grid-tasks" : "metric-grid";

  function renderMetricInner(metric: DashboardKpi) {
    const icon = metric.icon ?? TONE_ICON[metric.tone] ?? "bi-circle";
    if (variant === "summary") {
      return (
        <>
          <span className={`metric-summary-icon ${metric.tone}`} aria-hidden>
            <i className={`bi ${icon}`} />
          </span>
          <span className="metric-label">{metric.label}</span>
          {metric.hint ? <span className="metric-hint">{metric.hint}</span> : null}
          <span className="metric-summary-foot">
            <span className="metric-value">
              <CountUp end={metric.value} duration={1400} suffix={metric.suffix ?? ""} />
            </span>
            <span className="metric-trend">
              <i className="bi bi-dash-lg" aria-hidden />
              ce mois
            </span>
          </span>
        </>
      );
    }

    if (variant === "tasks") {
      return (
        <>
          <span className="metric-task-icon" aria-hidden>
            <i className={`bi ${icon}`} />
          </span>
          <span className="metric-label">{metric.label}</span>
          {metric.hint ? <span className="metric-hint">{metric.hint}</span> : null}
          <span className="metric-value">
            <CountUp end={metric.value} duration={1400} suffix={metric.suffix ?? ""} />
          </span>
          <span className="metric-task-go" aria-hidden>
            <i className="bi bi-arrow-right" />
          </span>
        </>
      );
    }

    return (
      <>
        <span className="metric-label">{metric.label}</span>
        {metric.hint ? <span className="metric-hint">{metric.hint}</span> : null}
        <span className="metric-value">
          <CountUp end={metric.value} duration={1400} suffix={metric.suffix ?? ""} />
        </span>
      </>
    );
  }

  return (
    <>
      <div className={gridClass}>
        {metrics.map((metric, index) => {
          const boxClass =
            variant === "summary"
              ? `metric-box metric-summary ${metric.tone}`
              : variant === "tasks"
                ? `metric-box metric-task ${metric.tone}`
                : `metric-box ${metric.tone}`;

          return metric.id ? (
            <button
              key={metric.id}
              type="button"
              className={boxClass}
              style={{ "--i": index } as CSSProperties}
              aria-haspopup="dialog"
              aria-expanded={open?.id === metric.id}
              onClick={() => openMetric(metric)}
            >
              {renderMetricInner(metric)}
            </button>
          ) : (
            <Link
              key={metric.label}
              href={metric.href}
              className={boxClass}
              style={{ "--i": index } as CSSProperties}
            >
              {renderMetricInner(metric)}
            </Link>
          );
        })}
      </div>

      {mounted && open
        ? createPortal(
            <div className="metric-drawer-root is-open">
              <button type="button" className="metric-drawer-backdrop" aria-label="Fermer le détail" onClick={close} />
              <aside
                className={`metric-drawer ${open.tone}${isCommentableDashboardKpi(open.id) ? " is-wide" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className="metric-drawer-head">
                  <div>
                    <p className="metric-drawer-kicker">{open.value.toLocaleString("fr-FR")}</p>
                    <div className="metric-drawer-title-row">
                      {open.icon ? <i className={`bi ${open.icon} metric-drawer-icon`} aria-hidden /> : null}
                      <h3 id={titleId}>{dashboardKpiHeading(open.label)}</h3>
                    </div>
                    {open.hint ? <p className="card-sub">{open.hint}</p> : null}
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    className="app-dialog-close"
                    aria-label="Fermer"
                    onClick={close}
                  >
                    <i className="bi bi-x-lg" aria-hidden />
                  </button>
                </header>

                <div className="metric-drawer-body">
                  {loading ? <p className="metric-drawer-status">Chargement…</p> : null}
                  {error ? <p className="metric-drawer-status is-error">{error}</p> : null}
                  {!loading && !error && items.length === 0 ? (
                    <p className="metric-drawer-status">Aucun prospect dans ce compteur.</p>
                  ) : null}
                  {!loading && items.length > 0 ? (
                    isCommentableDashboardKpi(open.id) ? (
                      <RelanceKpiTable
                        items={items}
                        showOwner={open.id === "all" || open.id === "dormant" || Boolean(open.id?.startsWith("status:"))}
                        commentPlaceholder={open.id === "all" ? "Commentaire direction…" : "Saisir une action…"}
                        onSaved={() => {
                          if (open.id) void reloadDetails(open.id);
                        }}
                      />
                    ) : (
                      <ul className="metric-drawer-list">
                        {items.map((item) => (
                          <li key={item.id}>
                            <Link href={item.href} className="metric-drawer-row">
                              <span className="metric-drawer-title">{item.title}</span>
                              <span className="metric-drawer-meta">
                                {item.status} · {item.owner}
                              </span>
                              <span className="metric-drawer-meta">
                                {item.code ? `${item.code} · ` : ""}Dernière action {item.lastAction}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : null}
                  {truncated ? (
                    <p className="metric-drawer-status">
                      Liste limitée à {DASHBOARD_KPI_DETAIL_LIMIT} fiches. Ouvrez la liste complète pour tout voir.
                    </p>
                  ) : null}
                </div>

                <footer className="metric-drawer-foot">
                  <Link href={open.href} className="btn-download">
                    Ouvrir la liste
                    <i className="bi bi-box-arrow-up-right" aria-hidden />
                  </Link>
                </footer>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
