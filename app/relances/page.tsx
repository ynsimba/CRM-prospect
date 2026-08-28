import Link from "next/link";
import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { monthGrid, parseYearMonth, startOfDay } from "@/lib/activity-logic";
import { listFollowUps, monthFollowUps, type FollowUpItem } from "@/lib/follow-ups";
import { PERMISSIONS } from "@/lib/permissions";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function FollowUpTable({ items }: { items: FollowUpItem[] }) {
  if (items.length === 0) {
    return <p className="empty-copy">Rien dans cette liste.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Quand</th>
            <th>Sujet</th>
            <th>Type</th>
            <th>Commercial</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.dueAt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" })}
              </td>
              <td>
                <Link href={item.href}>{item.title}</Link>
              </td>
              <td>{item.kind === "task" ? "Tâche" : "Relance prospect"}</td>
              <td>{item.ownerName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.activitiesRead);
  const params = await searchParams;
  const { year, monthIndex } = parseYearMonth(params.month);
  const today = startOfDay(new Date());
  const selectedDay = params.day ? Number(params.day) : undefined;
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  const [items, monthItems] = await Promise.all([
    listFollowUps(session),
    monthFollowUps(session, year, monthIndex),
  ]);

  const counts = new Map<number, number>();
  for (const item of monthItems) {
    const day = item.dueAt.getDate();
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const dayItems =
    selectedDay && !Number.isNaN(selectedDay)
      ? monthItems.filter((item) => item.dueAt.getDate() === selectedDay)
      : [];

  return (
    <Shell activeHref="/relances">
      <div className="page-head">
        <div>
          <h1 className="page-title">Relances</h1>
          <p className="card-sub">
            {items.filter((item) => item.bucket === "overdue").length} en retard ·{" "}
            {items.filter((item) => item.bucket === "today").length} aujourd’hui
          </p>
        </div>
        <div>
          <Link href={`/relances?month=${prevKey}`} className="table-action">
            Mois précédent
          </Link>
          {" · "}
          <Link href={`/relances?month=${nextKey}`} className="table-action">
            Mois suivant
          </Link>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <h3>
          {MONTH_LABELS[monthIndex]} {year}
        </h3>
        <div className="cal-grid" style={{ marginTop: 12 }}>
          {WEEKDAYS.map((day) => (
            <div key={day} className="cal-weekday">
              {day}
            </div>
          ))}
          {monthGrid(year, monthIndex).map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="cal-day is-empty" />;
            }
            const date = new Date(year, monthIndex, day);
            const isToday = startOfDay(date).getTime() === today.getTime();
            const count = counts.get(day) ?? 0;
            const href = `/relances?month=${monthKey}&day=${day}`;
            return (
              <Link
                key={day}
                href={href}
                className={`cal-day${isToday ? " is-today" : ""}${count ? " has-items" : ""}${selectedDay === day ? " is-selected" : ""}`}
              >
                <strong>{day}</strong>
                {count ? <span className="muted-line">{count} relance{count > 1 ? "s" : ""}</span> : null}
              </Link>
            );
          })}
        </div>
      </article>

      {selectedDay ? (
        <article className="dash-card" style={{ marginBottom: 16 }}>
          <h3>
            {selectedDay} {MONTH_LABELS[monthIndex]}
          </h3>
          <FollowUpTable items={dayItems} />
        </article>
      ) : null}

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>En retard</h3>
            <FollowUpTable items={items.filter((item) => item.bucket === "overdue")} />
          </article>
        </div>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>Aujourd’hui</h3>
            <FollowUpTable items={items.filter((item) => item.bucket === "today")} />
          </article>
        </div>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>À venir</h3>
            <FollowUpTable items={items.filter((item) => item.bucket === "upcoming")} />
          </article>
        </div>
      </div>
    </Shell>
  );
}
