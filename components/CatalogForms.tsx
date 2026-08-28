"use client";

import { useActionState } from "react";
import {
  createSourceAction,
  createStatusAction,
  createTagAction,
  type CatalogFormState,
} from "@/app/actions/catalog";

const initialState: CatalogFormState = {};

function MiniAddForm({
  action,
  placeholder,
  label,
}: {
  action: (prev: CatalogFormState, formData: FormData) => Promise<CatalogFormState>;
  placeholder: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        {label}
        <input name="name" required placeholder={placeholder} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "…" : "Ajouter"}
      </button>
    </form>
  );
}

export function StatusAddForm() {
  return <MiniAddForm action={createStatusAction} placeholder="En négociation" label="Nouveau statut" />;
}

export function SourceAddForm() {
  return <MiniAddForm action={createSourceAction} placeholder="Salon Kinshasa" label="Nouvelle source" />;
}

export function TagAddForm() {
  return <MiniAddForm action={createTagAction} placeholder="Partenaire" label="Nouveau tag" />;
}
