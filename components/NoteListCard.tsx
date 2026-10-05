"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  shareNoteAction,
  unshareNoteAction,
  type NoteFormState,
} from "@/app/actions/notes";
import { noteExcerpt } from "@/lib/notes-logic";
import { isDirectionRole, ROLE_LABELS } from "@/lib/roles";
import { relativeTimeLabel } from "@/lib/task-follow-logic";
import type { Role } from "@/lib/enums";

export type NoteShareTarget = {
  id: string;
  name: string;
  role: Role;
};

export type NoteListShare = {
  id: string;
  sharedWith: { id: string; name: string; role: Role };
};

export type NoteListItem = {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  updatedAt: Date | string;
  owner?: { id: string; name: string } | null;
  shares?: NoteListShare[];
};

type NoteListView = "list" | "compact";

const STORAGE_KEY = "safecheck.notes-list-view";
const shareInitial: NoteFormState = {};

function NoteSharePopover({
  note,
  shareTargets,
  onClose,
}: {
  note: NoteListItem;
  shareTargets: NoteShareTarget[];
  onClose: () => void;
}) {
  const [shareState, shareFormAction, sharePending] = useActionState(shareNoteAction, shareInitial);
  const panelRef = useRef<HTMLDivElement>(null);
  const directionTargets = shareTargets.filter((user) => isDirectionRole(user.role));
  const commercialTargets = shareTargets.filter((user) => !isDirectionRole(user.role));
  const activeShares = note.shares ?? [];
  const sharedIds = new Set(activeShares.map((share) => share.sharedWith.id));

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      // L’icône gère elle-même l’ouverture/fermeture.
      if (target.closest(".note-share-icon")) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (shareState.success) onClose();
  }, [shareState.success, onClose]);

  return (
    <div ref={panelRef} className="note-share-popover" role="dialog" aria-label="Partager la note">
      <form action={shareFormAction} className="note-share-form">
        <input type="hidden" name="noteId" value={note.id} />
        <select name="userId" required defaultValue="" aria-label="Destinataire">
          <option value="" disabled>
            Partager avec…
          </option>
          {directionTargets.length > 0 ? (
            <optgroup label="Direction">
              {directionTargets.map((user) => (
                <option key={user.id} value={user.id} disabled={sharedIds.has(user.id)}>
                  {user.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {commercialTargets.length > 0 ? (
            <optgroup label="Commerciaux">
              {commercialTargets.map((user) => (
                <option key={user.id} value={user.id} disabled={sharedIds.has(user.id)}>
                  {user.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <button type="submit" className="note-share-go" disabled={sharePending || shareTargets.length === 0}>
          {sharePending ? "…" : "OK"}
        </button>
      </form>
      {shareState.error ? <p className="login-error">{shareState.error}</p> : null}
      {activeShares.length > 0 ? (
        <ul className="note-share-recipients">
          {activeShares.map((share) => (
            <li key={share.id}>
              <span>
                {share.sharedWith.name}
                <em>{ROLE_LABELS[share.sharedWith.role]}</em>
              </span>
              <form action={unshareNoteAction.bind(null, note.id, share.sharedWith.id)}>
                <button type="submit" className="table-action" title="Retirer">
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function NoteListCard({
  notes,
  selectedId,
  currentUserId,
  shareTargets,
}: {
  notes: NoteListItem[];
  selectedId?: string | null;
  currentUserId: string;
  shareTargets: NoteShareTarget[];
}) {
  const [view, setView] = useState<NoteListView>("list");
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "list" || stored === "compact") {
        // Préférence locale uniquement après montage (évite un mismatch SSR/hydratation).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setView(stored);
      }
    } catch {
      // localStorage indisponible (mode privé strict) : on garde la vue liste.
    }
  }, []);

  function chooseView(next: NoteListView) {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore quota / mode privé.
    }
  }

  return (
    <aside className="dash-card note-list-card">
      <div className="note-list-head">
        <h3>Notes</h3>
        <div className="note-view-toggle" role="group" aria-label="Affichage de la liste">
          <button
            type="button"
            className={`note-view-btn ${view === "list" ? "is-active" : ""}`}
            aria-pressed={view === "list"}
            title="Vue liste"
            onClick={() => chooseView("list")}
          >
            <i className="bi bi-list-ul" aria-hidden />
            <span>Liste</span>
          </button>
          <button
            type="button"
            className={`note-view-btn ${view === "compact" ? "is-active" : ""}`}
            aria-pressed={view === "compact"}
            title="Vue compacte"
            onClick={() => chooseView("compact")}
          >
            <i className="bi bi-list" aria-hidden />
            <span>Compacte</span>
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="empty-copy">Aucune note pour le moment. Crée-en une pour commencer.</p>
      ) : (
        <ul className={`note-list is-${view}`}>
          {notes.map((note) => {
            const updatedAt = note.updatedAt instanceof Date ? note.updatedAt : new Date(note.updatedAt);
            const isOwner = note.ownerId === currentUserId;
            const shareCount = note.shares?.length ?? 0;
            const isSharing = sharingId === note.id;
            return (
              <li key={note.id} className={`note-list-row ${isSharing ? "is-sharing" : ""}`}>
                <div className="note-list-row-main">
                  <Link
                    href={`/notes?id=${note.id}`}
                    className={`note-list-item ${selectedId === note.id ? "is-active" : ""}`}
                  >
                    <strong>
                      <span className="note-list-title">{note.title}</span>
                      {!isOwner ? (
                        <span className="note-share-badge" title={`Partagée par ${note.owner?.name ?? "un collègue"}`}>
                          Reçue
                        </span>
                      ) : null}
                    </strong>
                    {view === "list" ? <span>{noteExcerpt(note.body)}</span> : null}
                    <em>{relativeTimeLabel(updatedAt)}</em>
                  </Link>
                  {isOwner ? (
                    <button
                      type="button"
                      className={`note-share-icon ${shareCount > 0 ? "is-shared" : ""} ${isSharing ? "is-open" : ""}`}
                      title={shareCount > 0 ? `Partagée avec ${shareCount}` : "Partager la note"}
                      aria-label="Partager la note"
                      aria-expanded={isSharing}
                      onClick={() => setSharingId(isSharing ? null : note.id)}
                    >
                      <i className="bi bi-share" aria-hidden />
                    </button>
                  ) : null}
                </div>
                {isSharing ? (
                  <NoteSharePopover
                    key={note.id}
                    note={note}
                    shareTargets={shareTargets}
                    onClose={() => setSharingId(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
