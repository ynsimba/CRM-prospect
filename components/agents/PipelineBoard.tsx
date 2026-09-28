import Link from "next/link";
import { formatFc } from "@/lib/money";

type Column = {
  id: string;
  name: string;
  isWon: boolean;
  isLost: boolean;
  count: number;
  value: number;
  items: { id: string; name: string; amount: number; ownerName: string; company: string | null; prospectId: string | null }[];
};

/** Read-only board: where the agent's deals stand, with count and value per stage (§4). */
export default function PipelineBoard({ columns, showOwner = false }: { columns: Column[]; showOwner?: boolean }) {
  if (columns.length === 0) return <p className="empty-copy">Aucun pipeline configuré.</p>;
  return (
    <div className="kanban-board cockpit-board" role="region" aria-label="Pipeline par étape" tabIndex={0}>
      {columns.map((column) => (
        <section key={column.id} className={`kanban-col ${column.isWon ? "is-won" : column.isLost ? "is-lost" : ""}`} aria-label={column.name}>
          <header className="cockpit-col-head">
            <h3>{column.name}</h3>
            <p>
              {column.count} prospect{column.count > 1 ? "s" : ""}
              {column.value > 0 ? ` — ${formatFc(column.value)}` : ""}
            </p>
          </header>
          {column.items.length === 0 ? <p className="cockpit-col-empty">—</p> : null}
          {column.items.map((item) => {
            const body = (
              <>
                <strong>{item.company ?? item.name}</strong>
                {item.company ? <span className="muted-line">{item.name}</span> : null}
                <span className="kanban-card-meta">
                  <span>{item.amount ? formatFc(item.amount) : "—"}</span>
                  {showOwner ? <span className="muted-line">{item.ownerName}</span> : null}
                </span>
              </>
            );
            return item.prospectId ? (
              <Link key={item.id} href={`/prospects/${item.prospectId}`} className="kanban-card cockpit-card">
                {body}
              </Link>
            ) : (
              <div key={item.id} className="kanban-card cockpit-card">
                {body}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
