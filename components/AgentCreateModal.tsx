"use client";

import { useCallback, useId, useRef, useState } from "react";
import AgentForm from "@/components/AgentForm";
import { createAgentAction } from "@/app/actions/agents";

type Option = { id: string; name: string };

export default function AgentCreateModal({ teams, zones, supervisors }: { teams: Option[]; zones: Option[]; supervisors: Option[] }) {
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
        <i className="bi bi-person-plus" aria-hidden /> Ajouter un agent
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
              <h3 id={titleId}>Nouvel agent commercial</h3>
              <p className="card-sub">L’e-mail est proposé à partir du prénom et du nom ; le matricule est attribué automatiquement.</p>
            </div>
            <button type="button" className="app-dialog-close" aria-label="Fermer" onClick={close}>
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          </div>
          <AgentForm
            key={formKey}
            action={createAgentAction}
            teams={teams}
            zones={zones}
            supervisors={supervisors}
            submitLabel="Créer l’agent"
            onSuccess={close}
          />
        </article>
      </dialog>
    </>
  );
}
