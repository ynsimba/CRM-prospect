"use client";

import { useCallback, useId, useRef, useState } from "react";
import UserForm from "@/components/UserForm";

export default function UserCreateModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [formKey, setFormKey] = useState(0);

  const open = () => {
    setFormKey((value) => value + 1);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button type="button" className="btn-download" onClick={open}>
        Créer un utilisateur
      </button>
      <dialog
        ref={dialogRef}
        className="app-dialog"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <article className="dash-card">
          <div className="app-dialog-head">
            <div>
              <h3 id={titleId}>Nouvel utilisateur</h3>
              <p className="card-sub">Trois rôles : Admin, Direction, Délégué commercial.</p>
            </div>
            <button type="button" className="app-dialog-close" aria-label="Fermer" onClick={close}>
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          </div>
          <UserForm key={formKey} onSuccess={close} />
        </article>
      </dialog>
    </>
  );
}
