import Link from "next/link";
import { groupByDay } from "@/components/agents/ui";
import { dayKey, relativeDayLabel } from "@/lib/agent-cockpit-logic";
import { TASK_TYPE_LABELS } from "@/lib/activity-logic";
import type { TaskType } from "@/lib/enums";

export type AgendaItem = {
  id: string;
  at: Date;
  type: TaskType;
  title: string;
  agentId: string;
  agentName: string;
  prospectId: string | null;
  prospectLabel: string | null;
  overdue: boolean;
};

const TYPE_ICONS: Record<TaskType, string> = {
  CALL: "bi-telephone",
  FOLLOW_UP: "bi-arrow-repeat",
  MEETING: "bi-people",
  VISIT: "bi-geo-alt",
  REUNION: "bi-easel",
  DEADLINE: "bi-flag",
  TASK: "bi-check2-square",
};

function heading(date: Date) {
  const relative = relativeDayLabel(date);
  const full = date.toLocaleDateString("fr-CD", { weekday: "long", day: "numeric", month: "long" });
  return relative === "Aujourd’hui" ? `Aujourd’hui — ${full}` : full.charAt(0).toUpperCase() + full.slice(1);
}

export default function AgendaList({ items, showAgent, empty }: { items: AgendaItem[]; showAgent: boolean; empty: string }) {
  if (items.length === 0) return <p className="empty-copy">{empty}</p>;
  const overdue = items.filter((item) => item.overdue);
  const upcoming = items.filter((item) => !item.overdue);
  return (
    <div className="agenda">
      {overdue.length > 0 ? (
        <section className="agenda-day is-overdue">
          <h3 className="agenda-day-title">En retard</h3>
          <ul className="agenda-list">{overdue.map((item) => row(item, showAgent, true))}</ul>
        </section>
      ) : null}
      {groupByDay(upcoming).map((group) => (
        <section key={dayKey(group.date)} className="agenda-day">
          <h3 className="agenda-day-title">{heading(group.date)}</h3>
          <ul className="agenda-list">{group.items.map((item) => row(item, showAgent, false))}</ul>
        </section>
      ))}
    </div>
  );
}

function row(item: AgendaItem, showAgent: boolean, withDate: boolean) {
  const time = item.at.toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" });
  return (
    <li key={item.id} className={`agenda-row type-${item.type.toLowerCase()}`}>
      <time className="agenda-time" dateTime={item.at.toISOString()}>
        {withDate ? item.at.toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit" }) : time === "00:00" ? "—" : time}
      </time>
      <span className="agenda-icon" aria-hidden>
        <i className={`bi ${TYPE_ICONS[item.type]}`} />
      </span>
      <span className="agenda-text">
        {showAgent ? (
          <Link href={`/direction/agents/${item.agentId}?onglet=agenda`} className="agenda-agent">
            {item.agentName}
          </Link>
        ) : null}
        {showAgent ? " → " : ""}
        <span className="agenda-type">{TASK_TYPE_LABELS[item.type]}</span>
        {" · "}
        {item.prospectId ? <Link href={`/prospects/${item.prospectId}`}>{item.prospectLabel ?? item.title}</Link> : item.title}
        {item.prospectId && item.title && item.title !== "Relance prévue" ? <span className="muted-line"> — {item.title}</span> : null}
      </span>
    </li>
  );
}
