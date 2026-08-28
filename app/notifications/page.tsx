import Shell from "@/components/Shell";
import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/notifications";
import { requireSession } from "@/lib/auth";
import { decodeNotificationBody } from "@/lib/notify-logic";
import { listNotifications } from "@/lib/notifications";

const KIND_LABELS: Record<string, { icon: string; label: string }> = {
  followup: { icon: "bi-alarm", label: "Relance" },
  task: { icon: "bi-check2-square", label: "Tâche" },
  score: { icon: "bi-thermometer-high", label: "Score" },
  assign: { icon: "bi-person-plus", label: "Attribution" },
  deal: { icon: "bi-trophy", label: "Affaire" },
  info: { icon: "bi-info-circle", label: "Info" },
};

export default async function NotificationsPage() {
  const session = await requireSession();
  const items = session.role === "SUPER_ADMIN" ? [] : await listNotifications(session);
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <Shell activeHref="/notifications">
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="card-sub">
            {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est à jour."}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="btn-download">
              Tout marquer lu
            </button>
          </form>
        ) : null}
      </div>

      <article className="dash-card">
        {items.length === 0 ? (
          <p className="empty-copy">Aucune notification pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const kind = KIND_LABELS[item.kind] ?? KIND_LABELS.info;
                  const decoded = decodeNotificationBody(item.body);
                  return (
                    <tr key={item.id}>
                      <td>
                        <i className={`bi ${kind.icon}`} aria-hidden /> {kind.label}
                      </td>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="muted-line">{decoded.text}</div>
                      </td>
                      <td>
                        {item.createdAt.toLocaleString("fr-CD", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        {item.readAt ? (
                          <span className="status-pill on">Lu</span>
                        ) : (
                          <span className="status-pill warn">Non lu</span>
                        )}
                      </td>
                      <td>
                        <form action={openNotificationAction.bind(null, item.id)}>
                          <button type="submit" className="table-action">
                            {decoded.href ? "Ouvrir" : "Marquer lu"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </Shell>
  );
}
