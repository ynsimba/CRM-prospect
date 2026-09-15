"use client";

import { useActionState } from "react";
import DateField from "@/components/DateField";
import { createTaskAction, type ActivityFormState } from "@/app/actions/activities";
import { PRIORITY_LABELS } from "@/lib/crm";

const initialState: ActivityFormState = {};

type Option = { id: string; name: string };

type TaskFormProps = {
  owners?: Option[];
  prospects?: { id: string; firstName: string; lastName: string; company?: { name: string } | null }[];
  prospectId?: string;
  opportunityId?: string;
  companyId?: string;
  defaultOwnerId?: string;
  requireOwner?: boolean;
  submitLabel?: string;
};

export default function TaskForm({
  owners = [],
  prospects = [],
  prospectId,
  opportunityId,
  companyId,
  defaultOwnerId,
  requireOwner = false,
  submitLabel = "Ajouter la tâche",
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="product-form">
      {prospectId ? <input type="hidden" name="prospectId" value={prospectId} /> : null}
      {opportunityId ? <input type="hidden" name="opportunityId" value={opportunityId} /> : null}
      {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
      <label className="login-field">
        Tâche
        <input name="title" required placeholder="Relancer par WhatsApp" />
      </label>
      {!prospectId ? (
        <label className="login-field">
          Entreprise concernée
          <select name="prospectId" defaultValue="">
            <option value="">Aucune</option>
            {prospects.map((prospect) => (
              <option key={prospect.id} value={prospect.id}>
                {prospect.company?.name ?? `${prospect.firstName} ${prospect.lastName}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {owners.length > 0 ? (
        <label className="login-field">
          Agent commercial
          <select name="ownerId" defaultValue={defaultOwnerId ?? ""} required={requireOwner}>
            {requireOwner ? <option value="">Choisir un commercial</option> : null}
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="login-field">
        Priorité
        <select name="priority" defaultValue="NORMAL">
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Date échéance
        <DateField name="dueAt" includeTime />
      </label>
      <label className="login-field">
        Notes
        <textarea name="description" rows={2} />
      </label>
      {owners.length > 0 ? (
        <label className="login-field">
          Commentaire directeur
          <textarea name="directorNote" rows={2} placeholder="Instructions pour le commercial" />
        </label>
      ) : null}
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
