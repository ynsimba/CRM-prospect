"use client";

import { useActionState } from "react";
import { createTaskAction, type ActivityFormState } from "@/app/actions/activities";
import { PRIORITY_LABELS } from "@/lib/crm";

const initialState: ActivityFormState = {};

type Option = { id: string; name: string };

type TaskFormProps = {
  owners?: Option[];
  prospects?: { id: string; firstName: string; lastName: string }[];
  prospectId?: string;
  opportunityId?: string;
  companyId?: string;
  defaultOwnerId?: string;
};

export default function TaskForm({
  owners = [],
  prospects = [],
  prospectId,
  opportunityId,
  companyId,
  defaultOwnerId,
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="product-form">
      {prospectId ? <input type="hidden" name="prospectId" value={prospectId} /> : null}
      {opportunityId ? <input type="hidden" name="opportunityId" value={opportunityId} /> : null}
      {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
      <label className="login-field">
        Titre
        <input name="title" required placeholder="Relancer par WhatsApp" />
      </label>
      {!prospectId ? (
        <label className="login-field">
          Prospect
          <select name="prospectId" defaultValue="">
            <option value="">Aucun</option>
            {prospects.map((prospect) => (
              <option key={prospect.id} value={prospect.id}>
                {prospect.firstName} {prospect.lastName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {owners.length > 0 ? (
        <label className="login-field">
          Assigné à
          <select name="ownerId" defaultValue={defaultOwnerId ?? ""}>
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
        Échéance
        <input name="dueAt" type="datetime-local" />
      </label>
      <label className="login-field">
        Notes
        <textarea name="description" rows={2} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter la tâche"}
      </button>
    </form>
  );
}
