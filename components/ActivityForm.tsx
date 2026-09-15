"use client";

import { useActionState } from "react";
import { createActivityAction, type ActivityFormState } from "@/app/actions/activities";
import DateField from "@/components/DateField";
import { ACTIVITY_LABELS } from "@/lib/activity-logic";

const initialState: ActivityFormState = {};

type ActivityFormProps = {
  prospectId?: string;
  opportunityId?: string;
  companyId?: string;
  showNextContact?: boolean;
};

export default function ActivityForm({
  prospectId,
  opportunityId,
  companyId,
  showNextContact = false,
}: ActivityFormProps) {
  const [state, formAction, pending] = useActionState(createActivityAction, initialState);

  return (
    <form action={formAction} className="product-form">
      {prospectId ? <input type="hidden" name="prospectId" value={prospectId} /> : null}
      {opportunityId ? <input type="hidden" name="opportunityId" value={opportunityId} /> : null}
      {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
      <label className="login-field">
        Type
        <select name="type" defaultValue="CALL">
          {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Commentaire
        <textarea name="comment" rows={3} placeholder="Compte-rendu…" />
      </label>
      <label className="login-field">
        Résultat
        <input name="outcome" placeholder="Décroche, rappel, RDV fixé…" />
      </label>
      <label className="login-field">
        Durée (min)
        <input name="durationMin" inputMode="numeric" />
      </label>
      {showNextContact ? (
        <label className="login-field">
          Prochaine relance
          <DateField name="nextContactAt" includeTime />
        </label>
      ) : null}
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Logger l’activité"}
      </button>
    </form>
  );
}
