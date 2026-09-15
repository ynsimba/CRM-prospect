"use client";

import Link from "next/link";
import { useTransition } from "react";
import { moveProspectStatusAction } from "@/app/actions/prospects";
import { fullName, statusPillClass } from "@/lib/crm";

export type StatusKanbanCard = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  ownerName: string | null;
  href: string;
};

export type StatusKanbanColumn = {
  id: string;
  name: string;
  slug: string;
  isConverted: boolean;
  isLost: boolean;
  items: StatusKanbanCard[];
};

export default function StatusKanban({
  columns,
  canManage,
}: {
  columns: StatusKanbanColumn[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function moveTo(prospectId: string, statusId: string) {
    startTransition(() => {
      void moveProspectStatusAction(prospectId, statusId);
    });
  }

  return (
    <div className={`kanban-board${pending ? " is-busy" : ""}`}>
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
                  const prospectId = event.dataTransfer.getData("text/plain");
                  if (prospectId) moveTo(prospectId, column.id);
                }
              : undefined
          }
        >
          <div className="kanban-col-head">
            <div>
              <strong>{column.name}</strong>
              <div className="muted-line">{column.items.length} entreprise(s)</div>
            </div>
            <span className={`status-pill ${statusPillClass(column.slug, column.isConverted, column.isLost)}`}>
              {column.items.length}
            </span>
          </div>
          {column.items.map((item) => (
            <article
              key={item.id}
              className="kanban-card"
              draggable={canManage}
              onDragStart={
                canManage
                  ? (event) => {
                      event.dataTransfer.setData("text/plain", item.id);
                    }
                  : undefined
              }
            >
              <Link href={item.href}>
                <strong>{item.companyName ?? fullName(item.firstName, item.lastName)}</strong>
              </Link>
              <div className="muted-line">{item.ownerName ?? "Non assigné"}</div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
