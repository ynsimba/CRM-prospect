"use client";

import { useRouter } from "next/navigation";
import { saveTaskDirectorNoteAction } from "@/app/actions/activities";

export default function TaskDirectorNoteForm({
  taskId,
  note,
}: {
  taskId: string;
  note: string;
}) {
  const router = useRouter();

  async function save(formData: FormData) {
    await saveTaskDirectorNoteAction(taskId, formData);
    router.refresh();
  }

  return (
    <form action={save} className="task-note-form task-director-note">
      <textarea
        name="directorNote"
        defaultValue={note}
        rows={2}
        placeholder="Commentaire direction…"
        aria-label="Commentaire directeur"
        onBlur={(event) => {
          if (event.currentTarget.value === note) return;
          event.currentTarget.form?.requestSubmit();
        }}
      />
      <button type="submit" className="table-action">
        Enregistrer
      </button>
    </form>
  );
}
