import { ACTIVITY_LABELS } from "@/lib/activity-logic";

type ActivityRow = {
  id: string;
  type: keyof typeof ACTIVITY_LABELS;
  occurredAt: Date;
  comment: string | null;
  outcome: string | null;
  user: { name: string };
};

export default function ActivityTimeline({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return <p className="empty-copy">Aucune activité pour le moment.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Détail</th>
            <th>Par</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>
                {activity.occurredAt.toLocaleString("fr-CD", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              <td>{ACTIVITY_LABELS[activity.type]}</td>
              <td>
                {activity.comment ?? activity.outcome ?? "—"}
                {activity.outcome && activity.comment ? (
                  <div className="muted-line">{activity.outcome}</div>
                ) : null}
              </td>
              <td>{activity.user.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
