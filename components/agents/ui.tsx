import Link from "next/link";
import type { ReactNode } from "react";
import { dayKey, relativeDayLabel, type Presence } from "@/lib/agent-cockpit-logic";
import type { TimelineEvent } from "@/lib/agents";
import { initialsFromName } from "@/lib/crm";

export type KpiAccent = "blue" | "amber" | "red" | "violet" | "teal" | "green";

export function KpiTile({
  label,
  value,
  icon,
  tone = "neutral",
  accent,
  alert = false,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  icon: string;
  tone?: "neutral" | "brand" | "danger" | "warn" | "info";
  /** Colour identity of the tile (overrides the neutral tone styling). */
  accent?: KpiAccent;
  /** Highlights a figure that needs attention with a pulsing marker. */
  alert?: boolean;
  hint?: ReactNode;
  href?: string;
}) {
  const className = `kpi-tile tone-${tone}${accent ? ` is-accent accent-${accent}` : ""}${alert ? " is-alert" : ""}`;
  const body = (
    <>
      <span className="kpi-icon" aria-hidden>
        <i className={`bi ${icon}`} />
      </span>
      {accent ? (
        <i className={`bi ${icon} kpi-watermark`} aria-hidden />
      ) : null}
      <span className="kpi-body">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
        {hint ? <span className="kpi-hint">{hint}</span> : null}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function AgentAvatar({ name, photoUrl, size = 36 }: { name: string; photoUrl?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (photoUrl) {
    // Data URLs stored on the agent record; next/image adds nothing for these tiny inline images.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className="agent-avatar is-photo" style={style} />;
  }
  return (
    <span className="agent-avatar" style={style} aria-hidden>
      {initialsFromName(name)}
    </span>
  );
}

export function PresenceDot({ value }: { value: Presence }) {
  if (!value) return null;
  const label = value === "online" ? "Connecté" : "Actif dans les dernières 24 h";
  return <span className={`presence-dot is-${value}`} title={label} aria-label={label} role="img" />;
}

export function ProgressBar({ pct, label }: { pct: number | null; label?: string }) {
  const width = pct === null ? 0 : Math.min(pct, 100);
  const tone = pct === null ? "" : pct >= 100 ? "is-done" : pct >= 70 ? "is-good" : pct >= 40 ? "is-mid" : "is-low";
  return (
    <span
      className={`progress-track ${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
      aria-label={label}
    >
      <span className="progress-fill" style={{ width: `${width}%` }} />
    </span>
  );
}

function dayHeading(date: Date, now: Date) {
  const relative = relativeDayLabel(date, now);
  if (relative === "Aujourd’hui" || relative === "Hier") return relative;
  return date.toLocaleDateString("fr-CD", { weekday: "long", day: "numeric", month: "long" });
}

export function groupByDay<T extends { at: Date }>(items: T[]) {
  const groups = new Map<string, { date: Date; items: T[] }>();
  for (const item of items) {
    const key = dayKey(item.at);
    const group = groups.get(key) ?? { date: item.at, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function Timeline({ events, empty, now = new Date() }: { events: TimelineEvent[]; empty: string; now?: Date }) {
  if (events.length === 0) return <p className="empty-copy">{empty}</p>;
  return (
    <div className="timeline">
      {groupByDay(events).map((group) => (
        <section key={dayKey(group.date)} className="timeline-day">
          <h3 className="timeline-day-title">{dayHeading(group.date, now)}</h3>
          <ol className="timeline-list">
            {group.items.map((event) => (
              <li key={event.id} className={`timeline-item kind-${event.kind}`}>
                <time className="timeline-time" dateTime={event.at.toISOString()}>
                  {event.at.toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" })}
                </time>
                <span className="timeline-icon" aria-hidden>
                  <i className={`bi ${event.icon}`} />
                </span>
                <span className="timeline-text">
                  {event.prospectId ? <Link href={`/prospects/${event.prospectId}`}>{event.text}</Link> : event.text}
                  {event.actorName ? <span className="muted-line"> · {event.actorName}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function PeriodForm({
  period,
  hidden = {},
  children,
  className,
}: {
  period: string;
  hidden?: Record<string, string | undefined>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <form method="get" className={className ? `cockpit-filters ${className}` : "cockpit-filters"}>
      {Object.entries(hidden).map(([key, value]) => (value ? <input key={key} type="hidden" name={key} value={value} /> : null))}
      {children}
      <label className="cockpit-filter">
        <span>Période</span>
        <select name="periode" defaultValue={period}>
          <option value="month">Ce mois</option>
          <option value="30d">30 derniers jours</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </label>
      <button type="submit" className="btn-download">
        <i className="bi bi-funnel" aria-hidden /> Filtrer
      </button>
    </form>
  );
}

export function formatDateShort(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit" });
}

/** hiredAt is a calendar date stored at UTC midnight: format it in UTC so it never shifts a day. */
export function formatCalendarDate(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

export function pct(value: number | null) {
  return value === null ? "—" : `${value} %`;
}
