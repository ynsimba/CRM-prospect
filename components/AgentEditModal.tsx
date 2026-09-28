"use client";

import { useCallback, useId, useRef, useState } from "react";
import AgentForm, { type AgentFormValues } from "@/components/AgentForm";
import type { AgentFormState } from "@/app/actions/agents";

type Option = { id: string; name: string };

export default function AgentEditModal({
  action,
  teams,
  zones,
  supervisors,
  agent,
}: {
  action: (state: AgentFormState, formData: FormData) => Promise<AgentFormState>;
  teams: Option[];
  zones: Option[];
  supervisors: Option[];
  agent: AgentFormValues;
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
              <h3 id={titleId}>Modifier la fiche</h3>
              <p className="card-sub">Les changements s’appliquent immédiatement et sont tracés dans le journal.</p>
            </div>
            <button type="button" className="app-dialog-close" aria-label="Fermer" onClick={close}>
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          </div>
          <AgentForm
            key={formKey}
            action={action}
            teams={teams}
            zones={zones}
            supervisors={supervisors}
            agent={agent}
            submitLabel="Enregistrer les modifications"
            onSuccess={close}
          />
        </article>
      </dialog>
    </>
  );
}
