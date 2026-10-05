import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { noteTitleFrom, sanitizeNoteHtml } from "@/lib/notes-logic";
import { notify } from "@/lib/notifications";
import type { SessionPayload } from "@/lib/session";

const NOTE_SHARE_INCLUDE = {
  owner: { select: { id: true, name: true } },
  shares: {
    include: {
      sharedWith: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

function noteAccessWhere(session: SessionPayload) {
  return {
    ...orgScope(session),
    OR: [
      { ownerId: session.userId },
      { shares: { some: { sharedWithId: session.userId } } },
    ],
  };
}

export async function listNotes(session: SessionPayload) {
  const notes = await prisma.userNote.findMany({
    where: noteAccessWhere(session),
    include: NOTE_SHARE_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  // Les destinataires ne voient pas la liste des autres personnes avec qui la note est partagée.
  return notes.map((note) =>
    note.ownerId === session.userId ? note : { ...note, shares: [] },
  );
}

export async function getNote(session: SessionPayload, id: string) {
  const note = await prisma.userNote.findFirst({
    where: { id, ...noteAccessWhere(session) },
    include: NOTE_SHARE_INCLUDE,
  });
  if (!note) return null;
  if (note.ownerId === session.userId) return note;
  return { ...note, shares: [] };
}

async function getOwnedNote(session: SessionPayload, id: string) {
  return prisma.userNote.findFirst({
    where: { id, ...orgScope(session), ownerId: session.userId },
    include: NOTE_SHARE_INCLUDE,
  });
}

export async function createNote(session: SessionPayload, title?: string, body?: string) {
  return prisma.userNote.create({
    data: {
      organizationId: session.organizationId,
      ownerId: session.userId,
      title: noteTitleFrom(title ?? "", "Sans titre"),
      // Chaîne toujours définie : la colonne MySQL body est NOT NULL.
      body: sanitizeNoteHtml(body ?? ""),
    },
  });
}

export async function updateNote(
  session: SessionPayload,
  id: string,
  input: { title?: string; body?: string },
) {
  const note = await getOwnedNote(session, id);
  if (!note) {
    throw new Error("Note introuvable ou non modifiable.");
  }
  return prisma.userNote.update({
    where: { id: note.id },
    data: {
      ...(input.title !== undefined ? { title: noteTitleFrom(input.title, "Sans titre") } : {}),
      ...(input.body !== undefined ? { body: sanitizeNoteHtml(input.body ?? "") } : {}),
    },
  });
}

export async function deleteNote(session: SessionPayload, id: string) {
  const note = await getOwnedNote(session, id);
  if (!note) {
    throw new Error("Note introuvable ou non supprimable.");
  }
  await prisma.userNote.delete({ where: { id: note.id } });
  return note;
}

export async function shareNote(session: SessionPayload, noteId: string, sharedWithId: string) {
  if (sharedWithId === session.userId) {
    throw new Error("Tu ne peux pas partager une note avec toi-même.");
  }

  const note = await getOwnedNote(session, noteId);
  if (!note) {
    throw new Error("Seule ta note peut être partagée.");
  }

  const target = await prisma.user.findFirst({
    where: {
      id: sharedWithId,
      ...orgScope(session),
      isActive: true,
    },
    select: { id: true, name: true, role: true },
  });
  if (!target) {
    throw new Error("Destinataire introuvable.");
  }
  if (!["SALES", "TEAM_LEAD", "MANAGER", "OWNER"].includes(target.role)) {
    throw new Error("Tu ne peux partager qu’avec la direction ou un commercial.");
  }

  const existing = await prisma.noteShare.findFirst({
    where: { noteId: note.id, sharedWithId: target.id },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Cette note est déjà partagée avec cette personne.");
  }

  const share = await prisma.noteShare.create({
    data: {
      organizationId: session.organizationId,
      noteId: note.id,
      sharedById: session.userId,
      sharedWithId: target.id,
    },
  });

  await notify({
    organizationId: session.organizationId,
    userId: target.id,
    title: "Note partagée",
    body: `${session.name} a partagé « ${note.title} » avec toi.`,
    kind: "note",
    href: `/notes?id=${note.id}`,
  });

  return share;
}

export async function unshareNote(session: SessionPayload, noteId: string, sharedWithId: string) {
  const note = await getOwnedNote(session, noteId);
  if (!note) {
    throw new Error("Seule ta note peut être départagée.");
  }

  const share = await prisma.noteShare.findFirst({
    where: {
      noteId: note.id,
      sharedWithId,
      organizationId: session.organizationId,
    },
  });
  if (!share) {
    throw new Error("Partage introuvable.");
  }

  await prisma.noteShare.delete({ where: { id: share.id } });
  return share;
}
