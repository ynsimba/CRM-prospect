"use client";

import { useActionState } from "react";
import { createCompanyAction, type CompanyFormState } from "@/app/actions/companies";

const initialState: CompanyFormState = {};

type OwnerOption = { id: string; name: string };

export default function CompanyForm({ owners }: { owners: OwnerOption[] }) {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom
        <input name="name" required placeholder="ABC SARL" />
      </label>
      <label className="login-field">
        Secteur
        <input name="industry" placeholder="BTP, services, distribution…" />
      </label>
      <label className="login-field">
        Ville
        <input name="city" placeholder="Kinshasa" />
      </label>
      <label className="login-field">
        E-mail
        <input name="email" type="email" />
      </label>
      <label className="login-field">
        Téléphone
        <input name="phone" placeholder="+243 810 000 000" />
      </label>
      <label className="login-field">
        Site web
        <input name="website" placeholder="https://" />
      </label>
      <label className="login-field">
        Taille
        <input name="size" placeholder="10-50, 50-200…" />
      </label>
      <label className="login-field">
        Commercial
        <select name="ownerId" defaultValue="">
          <option value="">Moi</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Adresse
        <input name="address" />
      </label>
      <label className="login-field">
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter l’entreprise"}
      </button>
    </form>
  );
}
