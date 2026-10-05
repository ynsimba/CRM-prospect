"use client";

import { useCallback, useId, useRef, useState } from "react";
import ProspectEditForm from "@/components/ProspectEditForm";
import { PROSPECT_PROFILE_FIELDS, type ProspectProfileField } from "@/lib/prospect-edit-policy";

export default function ProspectEditModal({
  prospectId,
  values,
  lockedFields,
  fullEdit,
}: {
  prospectId: string;
  values: Record<ProspectProfileField, string | Date | null>;
  lockedFields: ProspectProfileField[];
  fullEdit: boolean;
}) {
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
      <button type="button" className="profile-edit" aria-label="Modifier la fiche" onClick={open}>
        <i className="bi bi-pencil-square" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="app-dialog app-dialog-wide"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <article className="dash-card">
          <div className="app-dialog-head">
            <div>
              <h3 id={titleId}>{fullEdit ? "Modifier la fiche" : "Compléter la fiche"}</h3>
              <p className="card-sub">
                {fullEdit
                  ? "Modifiez les informations du prospect."
                  : `${PROSPECT_PROFILE_FIELDS.length - lockedFields.length} champ${PROSPECT_PROFILE_FIELDS.length - lockedFields.length > 1 ? "s" : ""} à compléter.`}
              </p>
            </div>
            <button type="button" className="app-dialog-close" aria-label="Fermer" onClick={close}>
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          </div>
          <ProspectEditForm
            key={formKey}
            prospectId={prospectId}
            values={values}
            lockedFields={lockedFields}
            fullEdit={fullEdit}
            onSuccess={close}
          />
        </article>
      </dialog>
    </>
  );
}
