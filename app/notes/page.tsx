import Link from "next/link";
import Shell from "@/components/Shell";
import NoteComposer from "@/components/NoteComposer";
import { createNoteAction } from "@/app/actions/notes";
import { requireCommercial } from "@/lib/auth";
import { noteExcerpt } from "@/lib/notes-logic";
import { listNotes } from "@/lib/notes";
import { relativeTimeLabel } from "@/lib/task-follow-logic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireCommercial();
  const params = await searchParams;
  const notes = await listNotes(session);
  const selected = notes.find((note) => note.id === params.id) ?? notes[0] ?? null;

  return (
    <Shell activeHref="/notes">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mes notes</h1>
          <p className="card-sub">Carnet personnel avec éditeur de texte — visites, consignes, idées.</p>
        </div>
        <form action={createNoteAction}>
          <button type="submit" className="btn-download">
            Nouvelle note
          </button>
        </form>
      </div>

      <div className="note-layout">
        <aside className="dash-card note-list-card">
          <h3>Notes</h3>
          {notes.length === 0 ? (
            <p className="empty-copy">Aucune note pour le moment. Crée-en une pour commencer.</p>
          ) : (
            <ul className="note-list">
              {notes.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/notes?id=${note.id}`}
                    className={`note-list-item ${selected?.id === note.id ? "is-active" : ""}`}
                  >
                    <strong>{note.title}</strong>
                    <span>{noteExcerpt(note.body)}</span>
                    <em>{relativeTimeLabel(note.updatedAt)}</em>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <article className="dash-card note-workspace">
          {selected ? (
            <NoteComposer note={selected} />
          ) : (
            <p className="empty-copy">Crée une note pour ouvrir l’éditeur.</p>
          )}
        </article>
      </div>
    </Shell>
  );
}
