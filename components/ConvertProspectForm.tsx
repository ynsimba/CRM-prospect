"use client";

import { useActionState } from "react";
import { convertProspectAction, type OpportunityFormState } from "@/app/actions/pipeline";

const initialState: OpportunityFormState = {};

type ConvertProspectFormProps = {
  prospectId: string;
  defaultName: string;
  stages: { id: string; name: string; isWon: boolean; isLost: boolean }[];
};

export default function ConvertProspectForm({
  prospectId,
  defaultName,
  stages,
}: ConvertProspectFormProps) {
  const action = convertProspectAction.bind(null, prospectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const openStages = stages.filter((stage) => !stage.isWon && !stage.isLost);
  const defaultStage =
    openStages.find((stage) => stage.name === "Qualifié")?.id ?? openStages[0]?.id ?? "";

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom de l’opportunité
        <input name="name" required defaultValue={defaultName} />
      </label>
      <label className="login-field">
        Étape
        <select name="stageId" defaultValue={defaultStage}>
          {openStages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Conversion…" : "Convertir en opportunité"}
      </button>
    </form>
  );
}
