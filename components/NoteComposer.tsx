"use client";

import { useActionState } from "react";
import NoteEditor from "@/components/NoteEditor";
import { deleteNoteAction, saveNoteAction, type NoteFormState } from "@/app/actions/notes";
import { relativeTimeLabel } from "@/lib/task-follow-logic";

type NoteRecord = {
  id: string;
  title: string;
  body: string;
  updatedAt: Date | string;
};

const initialState: NoteFormState = {};

export default function NoteComposer({
  note,
  readOnly = false,
  ownerName,
}: {
  note: NoteRecord;
  readOnly?: boolean;
  ownerName?: string;
}) {
  const save = saveNoteAction.bind(null, note.id);
  const [state, formAction, pending] = useActionState(save, initialState);
  const updatedAt = note.updatedAt instanceof Date ? note.updatedAt : new Date(note.updatedAt);

  if (readOnly) {
    return (
      <div className="note-composer is-readonly">
        <div className="note-composer-head">
          <h2 className="note-readonly-title">{note.title}</h2>
          <p className="muted-line">
            Partagée par {ownerName ?? "un collègue"} · {relativeTimeLabel(updatedAt)}
          </p>
        </div>
        <NoteEditor key={note.id} defaultValue={note.body} readOnly />
      </div>
    );
  }

  return (
    <form action={formAction} className="note-composer">
      <div className="note-composer-head">
        <label className="login-field note-title-field">
          Titre
          <input key={note.id} name="title" defaultValue={note.title} placeholder="Titre de la note" />
        </label>
        <p className="muted-line">Modifiée {relativeTimeLabel(updatedAt)}</p>
      </div>
      <NoteEditor key={note.id} defaultValue={note.body} />
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <div className="note-composer-actions">
        <button type="submit" className="btn-download" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="submit" className="table-action" formAction={deleteNoteAction.bind(null, note.id)}>
          Supprimer
        </button>
      </div>
    </form>
  );
}
