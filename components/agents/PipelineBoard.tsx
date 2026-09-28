import Link from "next/link";
import type { CSSProperties } from "react";
import { daysSince, pipelineSummary } from "@/lib/agent-cockpit-logic";
import type { PipelineColumn } from "@/lib/agents";

/** Open stages read left to right on a validated one-hue ordinal ramp (light → dark = early → late). */
const STAGE_RAMP = ["#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281"];
const WON = "#2f9e3e";
const LOST = "#d64545";

function stageColor(column: PipelineColumn, openIndex: number, openTotal: number) {
  if (column.isWon) return WON;
  if (column.isLost) return LOST;
  const step = openTotal <= 1 ? STAGE_RAMP.length - 1 : Math.round((openIndex / (openTotal - 1)) * (STAGE_RAMP.length - 1));
  return STAGE_RAMP[step];
}

function shortDate(date: Date) {
  return date.toLocaleDateString("fr-CD", { day: "2-digit", month: "short" });
}

/** Pipeline module (§4): deal distribution ribbon, then one column per stage (counts only, no monetary values). */
export default function PipelineBoard({ columns, showOwner = false }: { columns: PipelineColumn[]; showOwner?: boolean }) {
  if (columns.length === 0) return <p className="empty-copy">Aucun pipeline configuré.</p>;

  const now = new Date();
  const summary = pipelineSummary(columns);
  const openColumns = columns.filter((column) => !column.isWon && !column.isLost);
  const colorOf = new Map(
    columns.map((column) => [column.id, stageColor(column, openColumns.indexOf(column), openColumns.length)]),
  );
  const ribbonTotal = summary.openCount;

  return (
    <div className="pipe">
      <div className="pipe-ribbon-wrap">
        <p className="pipe-ribbon-title">Répartition des affaires en cours par étape</p>
        {ribbonTotal > 0 ? (
          <div className="pipe-ribbon" role="list">
            {openColumns
              .filter((column) => column.count > 0)
              .map((column) => {
                const part = column.count;
                const share = Math.round((part / ribbonTotal) * 100);
                const tip = `${column.name} : ${column.count} affaire${column.count > 1 ? "s" : ""} · ${share} %`;
                return (
                  <span
                    key={column.id}
                    role="listitem"
                    tabIndex={0}
                    className="pipe-ribbon-seg"
                    style={{ flexGrow: part, background: colorOf.get(column.id) } as CSSProperties}
                    aria-label={tip}
                    data-tip={tip}
                  />
                );
              })}
          </div>
        ) : (
          <div className="pipe-ribbon is-empty">
            <span>Aucune affaire en cours</span>
          </div>
        )}
      </div>

      <div className="kanban-board pipe-board" role="region" aria-label="Pipeline par étape" tabIndex={0}>
        {columns.map((column, index) => {
          const color = colorOf.get(column.id) ?? STAGE_RAMP[0];
          const share =
            column.isWon || column.isLost || !summary.openCount ? null : Math.round((column.count / summary.openCount) * 100);
          return (
            <section
              key={column.id}
              className={`pipe-col ${column.isWon ? "is-won" : ""} ${column.isLost ? "is-lost" : ""} ${column.count ? "" : "is-empty"}`}
              style={{ "--stage": color } as CSSProperties}
              aria-label={`${column.name} : ${column.count} affaire${column.count > 1 ? "s" : ""}`}
            >
              <header className="pipe-col-head">
                <div className="pipe-col-title">
                  <span className="pipe-step" aria-hidden>
                    {column.isWon ? <i className="bi bi-trophy-fill" /> : column.isLost ? <i className="bi bi-x-lg" /> : index + 1}
                  </span>
                  <h3>{column.name}</h3>
                  <span className="pipe-count">{column.count}</span>
                </div>
                <div className="pipe-col-meta">
                  <strong>
                    {column.count} affaire{column.count > 1 ? "s" : ""}
                  </strong>
                  {!column.isWon && !column.isLost ? <span>{column.probability} % de chances</span> : null}
                </div>
                {share !== null ? (
                  <span className="pipe-share" aria-hidden>
                    <span style={{ width: `${share}%` }} />
                  </span>
                ) : null}
              </header>

              <div className="pipe-cards">
                {column.items.length === 0 ? (
                  <p className="pipe-empty">
                    <i className="bi bi-inbox" aria-hidden /> Aucune affaire
                  </p>
                ) : (
                  column.items.map((item) => {
                    const overdue = Boolean(
                      item.expectedCloseAt && !column.isWon && !column.isLost && item.expectedCloseAt < now,
                    );
                    const idle = daysSince(item.updatedAt, now);
                    const body = (
                      <>
                        <span className="pipe-card-company">{item.company ?? item.name}</span>
                        {item.company ? <span className="pipe-card-name">{item.name}</span> : null}
                        <span className="pipe-card-foot">
                          {item.expectedCloseAt ? (
                            <span className={overdue ? "is-overdue" : undefined}>
                              <i className="bi bi-calendar-event" aria-hidden /> {shortDate(item.expectedCloseAt)}
                              {overdue ? " · en retard" : ""}
                            </span>
                          ) : null}
                          <span>
                            <i className="bi bi-clock-history" aria-hidden /> {idle <= 0 ? "aujourd’hui" : `il y a ${idle} j`}
                          </span>
                          {showOwner && item.ownerName ? (
                            <span>
                              <i className="bi bi-person" aria-hidden /> {item.ownerName}
                            </span>
                          ) : null}
                        </span>
                      </>
                    );
                    return item.prospectId ? (
                      <Link key={item.id} href={`/prospects/${item.prospectId}`} className="pipe-card">
                        {body}
                      </Link>
                    ) : (
                      <div key={item.id} className="pipe-card">
                        {body}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
