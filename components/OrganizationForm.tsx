"use client";

import { useActionState } from "react";
import { updateOrganizationAction, type SettingsFormState } from "@/app/actions/settings";

const initialState: SettingsFormState = {};

type OrganizationFormProps = {
  name: string;
  phone: string;
  website: string;
  currency: string;
  timezone: string;
};

export default function OrganizationForm(props: OrganizationFormProps) {
  const [state, formAction, pending] = useActionState(updateOrganizationAction, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Organisation
        <input name="name" required defaultValue={props.name} />
      </label>
      <label className="login-field">
        Téléphone
        <input name="phone" defaultValue={props.phone} />
      </label>
      <label className="login-field">
        Site web
        <input name="website" defaultValue={props.website} />
      </label>
      {/* No monetary values are shown in the app; keep the stored currency untouched on save. */}
      <input type="hidden" name="currency" value={props.currency} />
      <label className="login-field">
        Fuseau horaire
        <input name="timezone" defaultValue={props.timezone} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
