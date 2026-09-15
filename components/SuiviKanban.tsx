"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveProspectStatusAction } from "@/app/actions/prospects";
import type { SuiviColumn } from "@/lib/suivi-logic";

export default function SuiviKanban({
  columns,
  canManage,
}: {
  columns: SuiviColumn[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [overKey, setOverKey] = useState<string | null>(null);

  function moveTo(prospectId: string, statusId: string) {
    startTransition(() => {
      void moveProspectStatusAction(prospectId, statusId);
    });
  }

  return (
    <div className={`suivi-board${pending ? " is-busy" : ""}`}>
      {columns.map((column) => (
        <section
          key={column.key}
          className={`suivi-col${overKey === column.key ? " is-over" : ""}`}
          onDragOver={
            canManage && column.droppable
              ? (event) => {
                  event.preventDefault();
                  setOverKey(column.key);
                }
              : undefined
          }
          onDragLeave={
            canManage && column.droppable
              ? (event) => {
                  const next = event.relatedTarget as Node | null;
                  if (!event.currentTarget.contains(next)) {
                    setOverKey((current) => (current === column.key ? null : current));
                  }
                }
              : undefined
          }
          onDrop={
            canManage && column.droppable && column.statusId
              ? (event) => {
                  event.preventDefault();
                  setOverKey(null);
                  const prospectId = event.dataTransfer.getData("text/plain");
                  if (prospectId) moveTo(prospectId, column.statusId as string);
                }
              : undefined
          }
        >
          <div className={`suivi-pill tone-${column.tone}`}>
            <span>{column.name}</span>
            <span className="suivi-pill-count">{column.items.length}</span>
          </div>

          {column.items.length === 0 ? (
            <p className="suivi-empty">Aucun(e) entreprises</p>
          ) : (
            <div className="suivi-col-body">
              {column.items.map((item) => (
                <article
                  key={item.id}
                  className="suivi-card"
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
                  <Link href={item.href}>{item.title}</Link>
                  {item.ownerName ? <div className="suivi-card-meta">{item.ownerName}</div> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="suivi-col-add">
        <button type="button" className="suivi-plus" aria-label="Les étapes Safecheck sont fixes" disabled>
          <i className="bi bi-plus" aria-hidden />
        </button>
      </div>
    </div>
  );
}
