import Link from "next/link";
import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { PRIORITY_LABELS, fullName, priorityPillClass, statusPillClass } from "@/lib/crm";
import { listFollowUps, type FollowUpItem } from "@/lib/follow-ups";
import { PERMISSIONS } from "@/lib/permissions";
import { listProspects } from "@/lib/prospects";

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

export default async function FollowUpPage() {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const [items, prospects] = await Promise.all([
    listFollowUps(session),
    listProspects(session, { followUp: true }),
  ]);
  const overdue = items.filter((item) => item.bucket === "overdue");
  const today = items.filter((item) => item.bucket === "today");
  const upcoming = items.filter((item) => item.bucket === "upcoming");

  return (
    <Shell activeHref="/suivi">
      <div className="page-head">
        <div>
          <h1 className="page-title">Suivi prospect</h1>
          <p className="card-sub">
            {overdue.length} en retard · {today.length} aujourd’hui · {prospects.length} en cours
          </p>
        </div>
      </div>

      <div className="row g-3" style={{ marginBottom: 16 }}>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>En retard</h3>
            <FollowUpTable items={overdue} />
          </article>
        </div>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>Aujourd’hui</h3>
            <FollowUpTable items={today} />
          </article>
        </div>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>À venir</h3>
            <FollowUpTable items={upcoming} />
          </article>
        </div>
      </div>

      <article className="dash-card">
        <h3>Prospects en cours</h3>
        {prospects.length === 0 ? (
          <p className="empty-copy">Aucun prospect en suivi pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Statut</th>
                  <th>Prochain contact</th>
                  <th>Priorité</th>
                  <th>Commercial</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id}>
                    <td>
                      <Link href={`/prospects/${prospect.id}`}>
                        <strong>{fullName(prospect.firstName, prospect.lastName)}</strong>
                      </Link>
                      <div className="muted-line">{prospect.company?.name ?? prospect.email ?? prospect.phone}</div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${statusPillClass(prospect.status.slug, prospect.status.isConverted, prospect.status.isLost)}`}
                      >
                        {prospect.status.name}
                      </span>
                    </td>
                    <td>
                      {prospect.nextContactAt
                        ? prospect.nextContactAt.toLocaleString("fr-CD", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td>
                      <span className={`status-pill ${priorityPillClass(prospect.priority)}`}>
                        {PRIORITY_LABELS[prospect.priority]}
                      </span>
                    </td>
                    <td>{prospect.owner?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </Shell>
  );
}
