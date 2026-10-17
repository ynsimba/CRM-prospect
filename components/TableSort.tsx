"use client";

import { useEffect } from "react";
import { compareKeys, nextDirection, sortKey, type SortDirection } from "@/lib/table-sort-logic";

// Tri au clic sur l'en-tête, pour tous les tableaux. La grille prospects des commerciaux garde son tri serveur.
const EXCLUDED = ".prospect-grid.is-commercial, [data-no-sort]";
// Colonnes sans valeur à trier : cases de sélection, actions.
const SKIPPED_HEADERS = ".col-check, .col-actions";
const INTERACTIVE = "input, select, button, details, textarea";

function headerRow(table: HTMLTableElement) {
  const rows = table.tHead?.rows;
  return rows && rows.length ? rows[rows.length - 1] : null;
}

/** Position visuelle d'une cellule, colspans compris. */
function columnOf(cell: HTMLTableCellElement) {
  let index = 0;
  for (const sibling of Array.from(cell.parentElement?.children ?? [])) {
    if (sibling === cell) return index;
    index += (sibling as HTMLTableCellElement).colSpan || 1;
  }
  return index;
}

function cellAt(row: HTMLTableRowElement, column: number) {
  let index = 0;
  for (const cell of Array.from(row.cells)) {
    if (index === column) return cell;
    index += cell.colSpan || 1;
    if (index > column) return null;
  }
  return null;
}

function cellValue(cell: HTMLTableCellElement | null) {
  if (!cell) return "";
  if (cell.dataset.sortValue != null) return cell.dataset.sortValue;
  const field = cell.querySelector<HTMLInputElement | HTMLSelectElement>("input:not([type=hidden]), select");
  if (field instanceof HTMLSelectElement) return field.selectedOptions[0]?.text ?? "";
  return field ? field.value : (cell.textContent ?? "");
}

function sortBody(body: HTMLTableSectionElement, column: number, direction: SortDirection) {
  const rows = Array.from(body.rows);
  // Ligne « aucun résultat » (une seule cellule fusionnée) : rien à trier.
  const sortable = rows.filter((row) => !(row.cells.length === 1 && row.cells[0].colSpan > 1));
  if (sortable.length < 2) return;
  const keyed = sortable.map((row, order) => ({ row, order, key: sortKey(cellValue(cellAt(row, column))) }));
  keyed.sort((a, b) => compareKeys(a.key, b.key, direction) || a.order - b.order);
  const sameOrder = keyed.every((item, index) => item.row === sortable[index]);
  if (sameOrder) return;
  for (const { row } of keyed) body.appendChild(row);
}

function prepare(table: HTMLTableElement) {
  if (table.dataset.sortReady || table.matches(EXCLUDED)) return;
  const row = headerRow(table);
  if (!row || !table.tBodies.length) return;
  table.dataset.sortReady = "1";
  for (const th of Array.from(row.cells)) {
    if (!th.textContent?.trim() || th.matches(SKIPPED_HEADERS) || th.querySelector(INTERACTIVE) || th.colSpan > 1) {
      continue;
    }
    th.dataset.sortable = "1";
    th.tabIndex = 0;
    th.title = "Trier";
  }
}

function sortBy(th: HTMLTableCellElement) {
  const table = th.closest("table");
  const row = th.parentElement;
  if (!table || !row) return;
  const direction = nextDirection(th.getAttribute("aria-sort"));
  for (const cell of Array.from(row.children)) cell.removeAttribute("aria-sort");
  th.setAttribute("aria-sort", direction);
  const column = columnOf(th);
  table.dataset.sortColumn = String(column);
  table.dataset.sortDirection = direction;
  for (const body of Array.from(table.tBodies)) sortBody(body, column, direction);
}

export default function TableSort() {
  useEffect(() => {
    const scan = () => document.querySelectorAll("table").forEach((table) => prepare(table as HTMLTableElement));

    const onActivate = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
      const target = event.target as Element | null;
      if (target?.closest("a, " + INTERACTIVE)) return;
      const th = target?.closest<HTMLTableCellElement>("th[data-sortable]");
      if (!th) return;
      event.preventDefault();
      sortBy(th);
    };

    // Rendu React (filtres, rafraîchissement) : on prépare les nouveaux tableaux et on réapplique le tri actif.
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scan();
        document.querySelectorAll<HTMLTableElement>("table[data-sort-column]").forEach((table) => {
          const column = Number(table.dataset.sortColumn);
          const direction = table.dataset.sortDirection as SortDirection;
          for (const body of Array.from(table.tBodies)) sortBody(body, column, direction);
        });
      });
    });

    scan();
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onActivate);
    document.addEventListener("keydown", onActivate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("click", onActivate);
      document.removeEventListener("keydown", onActivate);
    };
  }, []);

  return null;
}
