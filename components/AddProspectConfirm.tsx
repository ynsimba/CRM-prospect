"use client";

import { useCallback, useId, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddProspectConfirm({
  triggerClassName = "suivi-add",
}: {
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const router = useRouter();

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => dialogRef.current?.showModal()}>
        Ajouter Prospect
        <i className="bi bi-chevron-right" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="confirm-box">
          <div className="confirm-head">
            <h2 id={titleId} className="confirm-title">
              Êtes vous sur de vouloir continuer ?
            </h2>
            <button type="button" className="confirm-close" aria-label="Fermer" onClick={close}>
              <i className="bi bi-x" aria-hidden />
            </button>
          </div>
          <p id={messageId} className="confirm-body">
            Vous allez ouvrir le formulaire “Ajouter un Prospect”
          </p>
          <div className="confirm-foot">
            <button type="button" className="confirm-cancel" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="confirm-continue"
              onClick={() => {
                close();
                router.push("/prospects/nouveau");
              }}
            >
              Continuer
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
