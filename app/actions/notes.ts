"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireNotesAccess } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { createNote, deleteNote, shareNote, unshareNote, updateNote } from "@/lib/notes";

export type NoteFormState = {
  error?: string;
  success?: string;
};

function revalidateNotes() {
  revalidatePath("/notes");
}

export async function createNoteAction() {
  const session = await requireNotesAccess();
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
  const session = await requireNotesAccess();
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
  const session = await requireNotesAccess();
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

export async function shareNoteAction(
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const session = await requireNotesAccess();
  const noteId = String(formData.get("noteId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!noteId || !userId) {
    return { error: "Choisis un destinataire." };
  }
  try {
    await shareNote(session, noteId, userId);
    await auditAs(session, {
      action: "note.share",
      entity: "UserNote",
      entityId: noteId,
      summary: `Partagée avec ${userId}`,
    });
    revalidateNotes();
    return { success: "Note partagée." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de partager la note.",
    };
  }
}

export async function unshareNoteAction(noteId: string, sharedWithId: string) {
  const session = await requireNotesAccess();
  await unshareNote(session, noteId, sharedWithId);
  await auditAs(session, {
    action: "note.unshare",
    entity: "UserNote",
    entityId: noteId,
    summary: `Partage retiré pour ${sharedWithId}`,
  });
  revalidateNotes();
}
