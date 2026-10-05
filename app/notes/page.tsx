import Shell from "@/components/Shell";
import NoteComposer from "@/components/NoteComposer";
import NoteListCard from "@/components/NoteListCard";
import { createNoteAction } from "@/app/actions/notes";
import { requireNotesAccess } from "@/lib/auth";
import { listNotes } from "@/lib/notes";
import { listNoteShareTargets } from "@/lib/users";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireNotesAccess();
  const params = await searchParams;
  const [notes, shareTargets] = await Promise.all([
    listNotes(session),
    listNoteShareTargets(session),
  ]);
  const selected = notes.find((note) => note.id === params.id) ?? notes[0] ?? null;
  const readOnly = Boolean(selected && selected.ownerId !== session.userId);

  return (
    <Shell activeHref="/notes">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mes notes</h1>
          <p className="card-sub">
            Carnet personnel avec éditeur de texte — partage possible avec la direction ou un commercial.
          </p>
        </div>
        <form action={createNoteAction}>
          <button type="submit" className="btn-download">
            Nouvelle note
          </button>
        </form>
      </div>

      <div className="note-layout">
        <NoteListCard
          notes={notes}
          selectedId={selected?.id}
          currentUserId={session.userId}
          shareTargets={shareTargets}
        />
        <article className="dash-card note-workspace">
          {selected ? (
            <NoteComposer
              note={selected}
              readOnly={readOnly}
              ownerName={selected.owner?.name}
            />
          ) : (
            <p className="empty-copy">Crée une note pour ouvrir l’éditeur.</p>
          )}
        </article>
      </div>
    </Shell>
  );
}
