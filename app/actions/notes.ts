"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCommercial } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { createNote, deleteNote, updateNote } from "@/lib/notes";

export type NoteFormState = {
  error?: string;
  success?: string;
};

function revalidateNotes() {
  revalidatePath("/notes");
}

export async function createNoteAction() {
  const session = await requireCommercial();
  const note = await createNote(session);
  await auditAs(session, {
    action: "note.create",
    entity: "UserNote",
    entityId: note.id,
    summary: note.title,
  });
  revalidateNotes();
  redirect(`/notes?id=${note.id}`);
}

export async function saveNoteAction(
  noteId: string,
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const session = await requireCommercial();
  try {
    await updateNote(session, noteId, {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
    await auditAs(session, {
      action: "note.update",
      entity: "UserNote",
      entityId: noteId,
      summary: "Note enregistrée",
    });
    revalidateNotes();
    return { success: "Note enregistrée." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d’enregistrer la note.",
    };
  }
}

export async function deleteNoteAction(noteId: string) {
  const session = await requireCommercial();
  const note = await deleteNote(session, noteId);
  await auditAs(session, {
    action: "note.delete",
    entity: "UserNote",
    entityId: note.id,
    summary: note.title,
  });
  revalidateNotes();
  redirect("/notes");
}
