import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { noteTitleFrom, sanitizeNoteHtml } from "@/lib/notes-logic";
import type { SessionPayload } from "@/lib/session";

export async function listNotes(session: SessionPayload) {
  return prisma.userNote.findMany({
    where: { ...orgScope(session), ownerId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export async function getNote(session: SessionPayload, id: string) {
  return prisma.userNote.findFirst({
    where: { id, ...orgScope(session), ownerId: session.userId },
  });
}

export async function createNote(session: SessionPayload, title?: string, body?: string) {
  return prisma.userNote.create({
    data: {
      organizationId: session.organizationId,
      ownerId: session.userId,
      title: noteTitleFrom(title ?? "", "Sans titre"),
      body: sanitizeNoteHtml(body ?? ""),
    },
  });
}

export async function updateNote(
  session: SessionPayload,
  id: string,
  input: { title?: string; body?: string },
) {
  const note = await getNote(session, id);
  if (!note) {
    throw new Error("Note introuvable.");
  }
  return prisma.userNote.update({
    where: { id: note.id },
    data: {
      ...(input.title !== undefined ? { title: noteTitleFrom(input.title, "Sans titre") } : {}),
      ...(input.body !== undefined ? { body: sanitizeNoteHtml(input.body) } : {}),
    },
  });
}

export async function deleteNote(session: SessionPayload, id: string) {
  const note = await getNote(session, id);
  if (!note) {
    throw new Error("Note introuvable.");
  }
  await prisma.userNote.delete({ where: { id: note.id } });
  return note;
}
