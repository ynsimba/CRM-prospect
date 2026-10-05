"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserPhotoAction } from "@/app/actions/profile";
import { resizeProfilePhoto } from "@/lib/resize-profile-photo";

type ToolbarProfileAvatarProps = {
  userName?: string;
  initials: string;
  photoUrl?: string | null;
};

export default function ToolbarProfileAvatar({ userName, initials, photoUrl }: ToolbarProfileAvatarProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPreview(photoUrl ?? null);
  }, [photoUrl]);

  const displayPhoto = preview || photoUrl || null;
  const firstName = userName?.trim().split(/\s+/).filter(Boolean)[0] ?? "Profil";

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
    <div className="toolbar-profile">
      <div className="toolbar-avatar">
        <button
          type="button"
          className="toolbar-avatar-photo-btn"
          aria-label="Changer la photo de profil"
          aria-busy={pending}
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {displayPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayPhoto} alt="" className="toolbar-avatar-badge is-photo" />
          ) : (
            <span className="toolbar-avatar-badge">{initials}</span>
          )}
          <span className="toolbar-avatar-photo-edit" aria-hidden>
            <i className="bi bi-camera" />
          </span>
        </button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="visually-hidden"
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
        <Link href="/parametres" className="toolbar-avatar-name">
          <span className="d-none d-md-inline">{firstName}</span>
          <span className="d-md-none">Profil</span>
        </Link>
      </div>
      {displayPhoto ? (
        <button
          type="button"
          className="toolbar-avatar-remove"
          disabled={pending}
          onClick={() => savePhoto(null)}
        >
          Retirer la photo
        </button>
      ) : null}
      {error ? <p className="toolbar-profile-error">{error}</p> : null}
    </div>
  );
}
