"use client";

import { useActionState } from "react";
import { createOpportunityAction, type OpportunityFormState } from "@/app/actions/pipeline";
import { fullName } from "@/lib/crm";

const initialState: OpportunityFormState = {};

type Option = { id: string; name: string };

type OpportunityFormProps = {
  stages: Option[];
  companies: Option[];
  owners: Option[];
  prospects: { id: string; firstName: string; lastName: string }[];
  defaultOwnerId?: string;
};

export default function OpportunityForm({
  stages,
  companies,
  owners,
  prospects,
  defaultOwnerId,
}: OpportunityFormProps) {
  const [state, formAction, pending] = useActionState(createOpportunityAction, initialState);
  const defaultStageId = stages[0]?.id ?? "";

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom
        <input name="name" required placeholder="CRM ABC SARL" />
      </label>
      <label className="login-field">
        Montant (FC)
        <input name="amount" required inputMode="numeric" placeholder="8 500 000" />
      </label>
      <label className="login-field">
        Étape
        <select name="stageId" defaultValue={defaultStageId}>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Entreprise
        <select name="companyId" defaultValue="">
          <option value="">Aucune</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Prospect
        <select name="prospectId" defaultValue="">
          <option value="">Aucun</option>
          {prospects.map((prospect) => (
            <option key={prospect.id} value={prospect.id}>
              {fullName(prospect.firstName, prospect.lastName)}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Commercial
        <select name="ownerId" defaultValue={defaultOwnerId ?? ""}>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Clôture prévue
        <input name="expectedCloseAt" type="date" />
      </label>
      <label className="login-field">
        Notes
        <textarea name="description" rows={3} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter l’opportunité"}
      </button>
    </form>
  );
}
