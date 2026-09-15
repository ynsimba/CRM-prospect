import type { MouseEvent, SyntheticEvent } from "react";

export const QUERY_TOOLBAR_MENU = "query-toolbar";

/** Ferme le `<details>` parent après le clic, sans bloquer la navigation du lien. */
export function closeMenuOnSelect(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest("a, button")) return;
  const details = event.currentTarget.closest("details");
  if (!details) return;
  window.setTimeout(() => {
    details.open = false;
  }, 0);
}

export function closeMenusIn(root: ParentNode | null) {
  if (!root) return;
  for (const details of root.querySelectorAll("details")) {
    details.open = false;
  }
}

/** Un seul menu ouvert à la fois dans la barre d’actions. */
export function keepSingleMenu(event: SyntheticEvent<HTMLDetailsElement>) {
  const current = event.currentTarget;
  if (!current.open) return;
  const root = current.closest(".query-actions, .suivi-actions");
  if (!root) return;
  for (const details of root.querySelectorAll("details")) {
    if (details !== current) details.open = false;
  }
}

