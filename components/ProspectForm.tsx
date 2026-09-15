"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createProspectAction, type ProspectFormState } from "@/app/actions/prospects";
import { initialsFromName } from "@/lib/crm";
import { toDateInput } from "@/lib/prospect-list-logic";
import CompanyNameField from "@/components/CompanyNameField";
import DateField from "@/components/DateField";

const initialState: ProspectFormState = {};

type Option = { id: string; name: string };

type ProspectFormProps = {
  statuses: Option[];
  sources: Option[];
  tags: Option[];
  companies: Option[];
  owners: Option[];
  defaultStatusId?: string;
  defaultOwnerId?: string;
  lockOwner?: boolean;
  lockStatus?: boolean;
};

function RequiredMark() {
  return (
    <span className="req" aria-hidden>
      {" "}
      *
    </span>
  );
}

export default function ProspectForm({
  statuses,
  companies,
  owners,
  defaultStatusId,
  defaultOwnerId,
  lockOwner = false,
}: ProspectFormProps) {
  const [state, formAction, pending] = useActionState(createProspectAction, initialState);
  const [formKey, setFormKey] = useState(0);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusId, setStatusId] = useState(defaultStatusId ?? statuses[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? "");
  const statusRef = useRef<HTMLDivElement>(null);
  const owner = owners.find((item) => item.id === ownerId);
  const statusName = statuses.find((item) => item.id === statusId)?.name ?? "Opportunité";

  useEffect(() => {
    if (!statusOpen) return;
    function onPointer(event: MouseEvent) {
      if (!statusRef.current?.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setStatusOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [statusOpen]);

  function clearForm() {
    setFormKey((value) => value + 1);
    setStatusOpen(false);
    setStatusId(defaultStatusId ?? statuses[0]?.id ?? "");
    setOwnerId(defaultOwnerId ?? "");
  }

  return (
    <form key={formKey} action={formAction} className="product-form prospect-form">
      <CompanyNameField companies={companies} />

      <label className="login-field">
        <span>
          Secteur
          <RequiredMark />
        </span>
        <input name="industry" required placeholder="BTP, services, distribution…" />
      </label>

      <div className="login-field">
        <span>Personne de contact</span>
        <Link href="/contacts/nouveau" className="btn-add-contact">
          + Ajouter contact
        </Link>
      </div>

      <label className="login-field">
        <span>
          Adresse
          <RequiredMark />
        </span>
        <input name="address" required placeholder="Avenue…" />
      </label>

      <label className="login-field">
        <span>
          Ville
          <RequiredMark />
        </span>
        <input name="city" required placeholder="Kinshasa" defaultValue="Kinshasa" />
      </label>

      <label className="login-field">
        Taille
        <input name="companySize" placeholder="10-50, 50-200…" />
      </label>

      <div className="login-field">
        <span>Statut</span>
        <div className={`chip-field status-picker ${statusOpen ? "is-open" : ""}`} ref={statusRef}>
          <button
            type="button"
            className="status-trigger"
            aria-haspopup="listbox"
            aria-expanded={statusOpen}
            onClick={() => setStatusOpen((open) => !open)}
          >
            <span className="status-chip">{statusName}</span>
            <i className={`bi ${statusOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden />
          </button>
          <input type="hidden" name="statusId" value={statusId} />
          {statusOpen ? (
            <div className="status-menu" role="listbox" aria-label="Statut">
              {statuses.map((item) => {
                const selected = item.id === statusId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "is-selected" : ""}
                    onClick={() => {
                      setStatusId(item.id);
                      setStatusOpen(false);
                    }}
                  >
                    {selected ? <i className="bi bi-check" aria-hidden /> : <span className="status-menu-gap" />}
                    {item.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <label className="login-field">
        Date premier contact
        <DateField name="firstContactAt" defaultValue={toDateInput(new Date())} />
      </label>

      <label className="login-field">
        Date RDV
        <DateField name="nextContactAt" />
      </label>

      <div className="login-field">
        <span>Commercial responsable</span>
        <div className={`chip-field owner-field ${lockOwner ? "is-locked" : ""}`}>
          <span className="owner-chip-avatar" aria-hidden>
            {initialsFromName(owner?.name ?? "") || "—"}
          </span>
          <span className="owner-chip-name">{owner?.name ?? "Vous"}</span>
          {lockOwner ? null : <i className="bi bi-chevron-down" aria-hidden />}
          <input type="hidden" name="ownerId" value={ownerId} />
          {lockOwner ? null : (
            <select aria-label="Commercial responsable" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              {owners.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {state.error ? <p className="login-error span-2">{state.error}</p> : null}
      {state.success ? <p className="form-success span-2">{state.success}</p> : null}

      <div className="prospect-form-footer span-2">
        <button type="button" className="form-reset" onClick={clearForm}>
          <i className="bi bi-arrow-counterclockwise" aria-hidden />
          Effacer le formulaire
        </button>
        <button type="submit" className="btn-download" disabled={pending}>
          {pending ? "Enregistrement…" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
