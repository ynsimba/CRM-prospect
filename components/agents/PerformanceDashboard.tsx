"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TREND_SERIES, type GoalMetricKey, type TrendKey, type TrendPoint } from "@/lib/agent-cockpit-logic";

type GoalRow = { key: GoalMetricKey; label: string; achieved: number; target: number; pct: number | null };

export type PerformanceData = {
  activity: {
    received: number;
    contacted: number;
    calls: number;
    emails: number;
    meetings: number;
    followUps: number;
    proposals: number;
  };
  results: { qualified: number; opportunities: number };
  ratios: {
    handling: number | null;
    qualification: number | null;
    meeting: number | null;
    conversion: number | null;
    firstContactDays: number | null;
    cycleDays: number | null;
  };
};

const nf = new Intl.NumberFormat("fr-CD");
const fmt = (value: number) => nf.format(value);

/* ------------------------------------------------------------------ shared pieces */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Smallest "nice" whole step so that 4 steps cover the value: axis ticks stay evenly spaced integers. */
function niceStep(value: number) {
  const raw = Math.max(value / 4, 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const factors = magnitude === 1 ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  return (factors.find((item) => item * magnitude >= raw) ?? 10) * magnitude;
}

function niceMax(value: number) {
  return niceStep(value) * 4;
}

/** Rectangle with rounded top corners only: the data end, while the baseline stays square. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`;
}

function Tooltip({ x, y, align, children }: { x: number; y: number; align: "left" | "right"; children: ReactNode }) {
  return (
    <div className={`viz-tooltip is-${align}`} style={{ left: x, top: y }} role="status">
      {children}
    </div>
  );
}

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <article className={`dash-card viz-card ${className}`}>
      <header className="viz-card-head">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
}

/* ------------------------------------------------------------------ 1. weekly trend (stacked bars) */

const TREND_COLORS: Record<TrendKey, string> = {
  calls: "var(--viz-1)",
  emails: "var(--viz-2)",
  meetings: "var(--viz-3)",
  proposals: "var(--viz-4)",
  other: "var(--viz-5)",
};

function TrendChart({ points }: { points: TrendPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hidden, setHidden] = useState<Set<TrendKey>>(new Set());
  const [active, setActive] = useState<number | null>(null);
  const height = 250;
  const pad = { top: 14, right: 8, bottom: 30, left: 34 };
  const visible = TREND_SERIES.filter((series) => !hidden.has(series.key));
  const totals = points.map((point) => visible.reduce((sum, series) => sum + point.values[series.key], 0));
  const max = niceMax(Math.max(...totals, 0));
  const plotW = Math.max(width - pad.left - pad.right, 0);
  const plotH = height - pad.top - pad.bottom;
  const band = points.length ? plotW / points.length : 0;
  const barW = Math.min(44, band * 0.56);
  const y = (value: number) => pad.top + plotH - (value / max) * plotH;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const grandTotal = points.reduce((sum, point) => sum + TREND_SERIES.reduce((s, series) => s + point.values[series.key], 0), 0);

  function toggle(key: TrendKey) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < TREND_SERIES.length - 1) next.add(key);
      return next;
    });
  }

  const hover = active !== null ? points[active] : null;
  const hoverX = active !== null ? pad.left + band * active + band / 2 : 0;

  return (
    <Card title="Tendance d’activité" subtitle="Interactions enregistrées par semaine, 8 dernières semaines" className="viz-trend">
      <div className="viz-legend" role="group" aria-label="Afficher ou masquer une série">
        {TREND_SERIES.map((series) => {
          const on = !hidden.has(series.key);
          return (
            <button
              key={series.key}
              type="button"
              className={`viz-legend-item ${on ? "" : "is-off"}`}
              aria-pressed={on}
              onClick={() => toggle(series.key)}
            >
              <span className="viz-key" style={{ background: TREND_COLORS[series.key] }} aria-hidden />
              {series.label}
            </button>
          );
        })}
      </div>

      <div ref={ref} className="viz-plot" style={{ height }} onPointerLeave={() => setActive(null)}>
        {width > 0 ? (
          <svg width={width} height={height} role="img" aria-label={`Activité hebdomadaire : ${fmt(grandTotal)} interactions sur 8 semaines`}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="viz-grid" />
                <text x={pad.left - 8} y={y(tick)} className="viz-axis" textAnchor="end" dominantBaseline="middle">
                  {fmt(tick)}
                </text>
              </g>
            ))}
            {active !== null ? (
              <rect x={pad.left + band * active + 2} y={pad.top} width={band - 4} height={plotH} className="viz-hover-band" rx={8} />
            ) : null}
            {points.map((point, index) => {
              const x = pad.left + band * index + (band - barW) / 2;
              let base = 0;
              const stack = visible.filter((series) => point.values[series.key] > 0);
              return (
                <g key={point.label} className={active !== null && active !== index ? "viz-dim" : undefined}>
                  {stack.map((series, i) => {
                    const value = point.values[series.key];
                    const top = y(base + value);
                    const bottom = y(base);
                    base += value;
                    // 2px surface gap between stacked segments.
                    const h = Math.max(bottom - top - (i < stack.length - 1 ? 2 : 0), 1);
                    const isTop = i === stack.length - 1;
                    return isTop ? (
                      <path key={series.key} d={topRounded(x, top, barW, h, 4)} fill={TREND_COLORS[series.key]} />
                    ) : (
                      <rect key={series.key} x={x} y={top + (bottom - top - h)} width={barW} height={h} fill={TREND_COLORS[series.key]} />
                    );
                  })}
                  <text x={pad.left + band * index + band / 2} y={height - 10} className="viz-axis" textAnchor="middle">
                    {point.label}
                  </text>
                  {/* Hit target: the whole column, focusable for keyboard users. */}
                  <rect
                    x={pad.left + band * index}
                    y={pad.top}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    className="viz-hit"
                    aria-label={`${point.label} (${point.range}) : ${visible
                      .map((series) => `${series.label} ${point.values[series.key]}`)
                      .join(", ")}`}
                    onPointerEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}
        {grandTotal === 0 && width > 0 ? <p className="viz-empty">Aucune interaction enregistrée sur ces 8 semaines.</p> : null}
        {hover ? (
          <Tooltip x={hoverX} y={pad.top} align={hoverX > width * 0.62 ? "right" : "left"}>
            <p className="viz-tooltip-title">
              {hover.label} <span>{hover.range}</span>
            </p>
            <ul>
              {visible.map((series) => (
                <li key={series.key}>
                  <span className="viz-line-key" style={{ background: TREND_COLORS[series.key] }} aria-hidden />
                  <strong>{fmt(hover.values[series.key])}</strong> {series.label}
                </li>
              ))}
            </ul>
            <p className="viz-tooltip-total">
              <strong>{fmt(visible.reduce((sum, series) => sum + hover.values[series.key], 0))}</strong> au total
            </p>
          </Tooltip>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ 2. activity bars with goals */

function ActivityBars({ data, goals }: { data: PerformanceData["activity"]; goals?: GoalRow[] }) {
  const [active, setActive] = useState<string | null>(null);
  const goal = (key: GoalMetricKey) => goals?.find((item) => item.key === key && item.target > 0);
  const rows = [
    { key: "received", label: "Prospects reçus", value: data.received },
    { key: "contacted", label: "Prospects contactés", value: data.contacted, goal: goal("prospects") },
    { key: "calls", label: "Appels", value: data.calls, goal: goal("calls") },
    { key: "emails", label: "E-mails", value: data.emails },
    { key: "meetings", label: "RDV", value: data.meetings, goal: goal("meetings") },
    { key: "followUps", label: "Relances", value: data.followUps },
    { key: "proposals", label: "Propositions", value: data.proposals, goal: goal("proposals") },
  ];
  const max = niceMax(Math.max(...rows.map((row) => Math.max(row.value, row.goal?.target ?? 0)), 0));

  return (
    <Card title="Activité de la période" subtitle={goals ? "Barre = réalisé · repère = objectif du mois" : "Volume par type d’action"}>
      <ul className="viz-hbars">
        {rows.map((row) => {
          const width = (row.value / max) * 100;
          const target = row.goal ? (row.goal.target / max) * 100 : null;
          const isActive = active === row.key;
          return (
            <li
              key={row.key}
              className={`viz-hbar ${active && !isActive ? "viz-dim" : ""}`}
              tabIndex={0}
              onPointerEnter={() => setActive(row.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(row.key)}
              onBlur={() => setActive(null)}
            >
              <span className="viz-hbar-label">{row.label}</span>
              <span className="viz-hbar-track" aria-hidden>
                <span className="viz-hbar-fill" style={{ width: `${width}%` }} />
                {target !== null ? <span className="viz-hbar-goal" style={{ left: `${Math.min(target, 100)}%` }} /> : null}
              </span>
              <span className="viz-hbar-value">
                {fmt(row.value)}
                {row.goal ? <small> / {fmt(row.goal.target)}</small> : null}
              </span>
              {isActive ? (
                <span className="viz-tooltip is-inline" role="status">
                  <strong>{fmt(row.value)}</strong> {row.label.toLowerCase()}
                  {row.goal ? (
                    <>
                      {" "}
                      · objectif {fmt(row.goal.target)} · <strong>{row.goal.pct ?? 0} %</strong>
                    </>
                  ) : null}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ 3. conversion funnel */

function Funnel({ data }: { data: PerformanceData }) {
  const [active, setActive] = useState<number | null>(null);
  const stages = [
    { label: "Prospects reçus", value: data.activity.received },
    { label: "Prospects contactés", value: data.activity.contacted },
    { label: "Prospects qualifiés", value: data.results.qualified },
    { label: "Opportunités créées", value: data.results.opportunities },
  ];
  const max = Math.max(...stages.map((stage) => stage.value), 1);
  return (
    <Card title="Entonnoir de conversion" subtitle="Du prospect reçu à l’opportunité">
      <ol className="viz-funnel">
        {stages.map((stage, index) => {
          const previous = index > 0 ? stages[index - 1].value : null;
          const rate = previous ? Math.round((stage.value / previous) * 100) : null;
          return (
            <li
              key={stage.label}
              className={`viz-funnel-step step-${index + 1} ${active !== null && active !== index ? "viz-dim" : ""}`}
              tabIndex={0}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              {index > 0 ? (
                <span className="viz-funnel-rate">
                  <i className="bi bi-arrow-down-short" aria-hidden /> {rate === null ? "—" : `${rate} %`}
                  <span className="visually-hidden"> de l’étape précédente</span>
                </span>
              ) : null}
              <span className="viz-funnel-bar-wrap" aria-hidden>
                <span className="viz-funnel-bar" style={{ width: `${Math.max((stage.value / max) * 100, 4)}%` }} />
              </span>
              <span className="viz-funnel-text">
                <strong>{fmt(stage.value)}</strong> {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
      {data.activity.received === 0 && data.activity.contacted === 0 ? (
        <p className="viz-note">L’entonnoir se remplira avec les premiers prospects de la période.</p>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ 4. ratio gauges */

const RATIO_HELP: Record<string, string> = {
  handling: "Prospects reçus sur la période qui ont été contactés.",
  qualification: "Prospects contactés passés au statut qualifié.",
  meeting: "Rendez-vous obtenus rapportés aux prospects contactés.",
  conversion: "Conversions rapportées aux prospects reçus.",
};

function Gauge({ id, metric, label, value }: { id: string; metric: string; label: string; value: number | null }) {
  const [hover, setHover] = useState(false);
  const size = 112;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.75; // 270° gauge
  const filled = value === null ? 0 : (Math.min(value, 100) / 100) * arc;
  const tone = value === null ? "is-none" : value >= 60 ? "is-good" : value >= 30 ? "is-mid" : "is-low";
  return (
    <figure
      className={`viz-gauge ${tone}`}
      tabIndex={0}
      aria-describedby={id}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} className="viz-gauge-track" strokeWidth={stroke} strokeDasharray={`${arc} ${circumference}`} />
          {filled > 0 ? (
            <circle cx={size / 2} cy={size / 2} r={r} className="viz-gauge-fill" strokeWidth={stroke} strokeDasharray={`${filled} ${circumference}`} />
          ) : null}
        </g>
      </svg>
      <span className="viz-gauge-value">{value === null ? "—" : `${value} %`}</span>
      <figcaption>{label}</figcaption>
      <span id={id} className={hover ? "viz-tooltip is-below" : "visually-hidden"} role={hover ? "status" : undefined}>
        {RATIO_HELP[metric]}
        {value === null ? " Pas encore assez de données." : ""}
      </span>
    </figure>
  );
}

function Ratios({ ratios }: { ratios: PerformanceData["ratios"] }) {
  const base = useId();
  const gauges = [
    { key: "handling", label: "Prise en charge", value: ratios.handling },
    { key: "qualification", label: "Qualification", value: ratios.qualification },
    { key: "meeting", label: "Taux RDV", value: ratios.meeting },
    { key: "conversion", label: "Conversion", value: ratios.conversion },
  ];
  return (
    <Card title="Ratios" subtitle="Survole une jauge pour sa définition">
      <div className="viz-gauges">
        {gauges.map((gauge) => (
          <Gauge key={gauge.key} id={`${base}-${gauge.key}`} metric={gauge.key} label={gauge.label} value={gauge.value} />
        ))}
      </div>
      <div className="viz-delays">
        <div className="viz-delay">
          <i className="bi bi-stopwatch" aria-hidden />
          <span>
            <strong>{ratios.firstContactDays === null ? "—" : `${ratios.firstContactDays} j`}</strong>
            Délai moyen de premier contact
          </span>
        </div>
        <div className="viz-delay">
          <i className="bi bi-arrow-repeat" aria-hidden />
          <span>
            <strong>{ratios.cycleDays === null ? "—" : `${ratios.cycleDays} j`}</strong>
            Durée moyenne du cycle commercial
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ table view (accessibility relief) */

function DataTables({ data, trend }: { data: PerformanceData; trend: TrendPoint[] }) {
  const pct = (value: number | null) => (value === null ? "—" : `${value} %`);
  const rows: [string, string][] = [
    ["Prospects reçus", fmt(data.activity.received)],
    ["Prospects contactés", fmt(data.activity.contacted)],
    ["Appels", fmt(data.activity.calls)],
    ["E-mails", fmt(data.activity.emails)],
    ["RDV", fmt(data.activity.meetings)],
    ["Relances", fmt(data.activity.followUps)],
    ["Propositions", fmt(data.activity.proposals)],
    ["Prospects qualifiés", fmt(data.results.qualified)],
    ["Opportunités créées", fmt(data.results.opportunities)],
    ["Taux de prise en charge", pct(data.ratios.handling)],
    ["Taux de qualification", pct(data.ratios.qualification)],
    ["Taux RDV", pct(data.ratios.meeting)],
    ["Taux de conversion", pct(data.ratios.conversion)],
  ];
  return (
    <details className="viz-table-toggle">
      <summary>
        <i className="bi bi-table" aria-hidden /> Voir les données en tableau
      </summary>
      <div className="viz-tables">
        <div className="table-wrap">
          <table className="data-table">
            <caption>Activité hebdomadaire</caption>
            <thead>
              <tr>
                <th scope="col">Semaine</th>
                {TREND_SERIES.map((series) => (
                  <th key={series.key} scope="col" className="num">
                    {series.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trend.map((point) => (
                <tr key={point.label}>
                  <th scope="row">
                    {point.label} <span className="muted-line">{point.range}</span>
                  </th>
                  {TREND_SERIES.map((series) => (
                    <td key={series.key} className="num">
                      {fmt(point.values[series.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <caption>Indicateurs de la période</caption>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td className="num">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ dashboard */

/** Performance module of the agent sheet (§11): trend, activity vs goals, funnel and ratios. */
export default function PerformanceDashboard({ data, goals, trend }: { data: PerformanceData; goals?: GoalRow[]; trend: TrendPoint[] }) {
  return (
    <div className="perf-dash">
      <TrendChart points={trend} />
      <div className="perf-dash-grid">
        <ActivityBars data={data.activity} goals={goals} />
        <Funnel data={data} />
      </div>
      <Ratios ratios={data.ratios} />
      <DataTables data={data} trend={trend} />
    </div>
  );
}
