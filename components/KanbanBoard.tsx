"use client";

import Link from "next/link";
import { useTransition } from "react";
import { moveOpportunityAction } from "@/app/actions/pipeline";
import { formatFc } from "@/lib/money";
import { stagePillClass, weightedAmount } from "@/lib/pipeline-logic";

export type KanbanCard = {
  id: string;
  name: string;
  amount: number;
  probability: number;
  companyName: string | null;
  ownerName: string | null;
};

export type KanbanColumn = {
  id: string;
  name: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  total: number;
  weighted: number;
  opportunities: KanbanCard[];
};

export default function KanbanBoard({
  columns,
  canManage,
}: {
  columns: KanbanColumn[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function moveTo(opportunityId: string, stageId: string) {
    startTransition(() => {
      void moveOpportunityAction(opportunityId, stageId);
    });
  }

  return (
    <div
      className={`kanban-board${pending ? " is-busy" : ""}`}
      role="region"
      aria-label="Colonnes du tableau"
      aria-busy={pending}
      tabIndex={0}
    >
      {columns.map((column) => (
        <section
          key={column.id}
          className="kanban-col"
          onDragOver={
            canManage
              ? (event) => {
                  event.preventDefault();
                }
              : undefined
          }
          onDrop={
            canManage
              ? (event) => {
                  event.preventDefault();
                  const opportunityId = event.dataTransfer.getData("text/plain");
                  if (opportunityId) moveTo(opportunityId, column.id);
                }
              : undefined
          }
        >
          <div className="kanban-col-head">
            <div>
              <strong>{column.name}</strong>
              <div className="muted-line">
                {column.opportunities.length} · pondéré {formatFc(column.weighted)}
              </div>
            </div>
            <span className={`status-pill ${stagePillClass(column)}`}>
              {formatFc(column.total)}
            </span>
          </div>
          {column.opportunities.map((item) => (
            <article
              key={item.id}
              className="kanban-card"
              draggable={canManage}
              onDragStart={
                canManage
                  ? (event) => {
                      event.dataTransfer.setData("text/plain", item.id);
                      event.dataTransfer.effectAllowed = "move";
                    }
                  : undefined
              }
            >
              <Link href={`/pipeline/${item.id}`}>
                <strong>{item.name}</strong>
              </Link>
              <div className="muted-line">{item.companyName ?? item.ownerName ?? "—"}</div>
              <div className="kanban-card-meta">
                <span>{formatFc(item.amount)}</span>
                <span>{formatFc(weightedAmount(item.amount, item.probability))}</span>
              </div>
              {canManage ? (
                <label className="login-field">
                  Étape
                  <select
                    value={column.id}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => moveTo(item.id, event.target.value)}
                  >
                    {columns.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
