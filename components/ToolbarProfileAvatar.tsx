"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { updateUserPhotoAction } from "@/app/actions/profile";
import { resizeProfilePhoto } from "@/lib/resize-profile-photo";

type ToolbarProfileAvatarProps = {
  displayName: string;
  roleLabel: string;
  initials: string;
  photoUrl?: string | null;
};

export default function ToolbarProfileAvatar({ displayName, roleLabel, initials, photoUrl }: ToolbarProfileAvatarProps) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPreview(photoUrl ?? null);
  }, [photoUrl]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayPhoto = preview || photoUrl || null;

  function savePhoto(next: string | null) {
    setError("");
    startTransition(async () => {
      const result = await updateUserPhotoAction(next);
      if (!result.ok) {
        setError(result.error);
        setPreview(photoUrl ?? null);
        return;
      }
      setPreview(next);
      router.refresh();
    });
  }

  return (
    <div className="toolbar-profile" ref={rootRef}>
      <button
        type="button"
        className="toolbar-user"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-busy={pending}
        onClick={() => setOpen((value) => !value)}
      >
        {displayPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayPhoto} alt="" className="toolbar-avatar-badge is-photo" />
        ) : (
          <span className="toolbar-avatar-badge" aria-hidden>
            {initials}
          </span>
        )}
        <span className="toolbar-user-meta">
          <span className="toolbar-user-name">{displayName}</span>
          <span className="toolbar-user-role">{roleLabel}</span>
        </span>
        <i className={`bi bi-chevron-down toolbar-user-caret ${open ? "is-open" : ""}`} aria-hidden />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="visually-hidden"
        tabIndex={-1}
        aria-label="Photo de profil"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          try {
            const dataUrl = await resizeProfilePhoto(file);
            setPreview(dataUrl);
            savePhoto(dataUrl);
          } catch {
            setError("Image illisible. Choisis un PNG, JPEG ou WebP.");
          }
        }}
      />

      {open ? (
        <div className="toolbar-user-menu" id={menuId} role="menu">
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              inputRef.current?.click();
            }}
          >
            <i className="bi bi-camera" aria-hidden />
            Changer la photo
          </button>
          {displayPhoto ? (
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                savePhoto(null);
              }}
            >
              <i className="bi bi-trash3" aria-hidden />
              Retirer la photo
            </button>
          ) : null}
          <Link href="/parametres#mot-de-passe" role="menuitem" onClick={() => setOpen(false)}>
            <i className="bi bi-key" aria-hidden />
            Changer le mot de passe
          </Link>
          <Link href="/parametres" role="menuitem" onClick={() => setOpen(false)}>
            <i className="bi bi-gear" aria-hidden />
            Paramètres
          </Link>
          <form action={logoutAction}>
            <button type="submit" role="menuitem">
              <i className="bi bi-box-arrow-right" aria-hidden />
              Déconnexion
            </button>
          </form>
        </div>
      ) : null}
      {error ? <p className="toolbar-profile-error">{error}</p> : null}
    </div>
  );
}
