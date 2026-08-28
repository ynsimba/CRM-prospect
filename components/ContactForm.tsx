"use client";

import { useActionState } from "react";
import { createContactAction, type ContactFormState } from "@/app/actions/contacts";
import { PERSON_CATEGORIES } from "@/lib/crm";
import SearchSelect from "@/components/SearchSelect";

const initialState: ContactFormState = {};

type ContactFormProps = {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
};

export default function ContactForm({ companies, defaultCompanyId }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(createContactAction, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Prénom
        <input name="firstName" required placeholder="Patrick" />
      </label>
      <label className="login-field">
        Nom
        <input name="lastName" required placeholder="Mwamba" />
      </label>
      <label className="login-field">
        Fonction
        <input name="jobTitle" placeholder="Directeur commercial" />
      </label>
      <SearchSelect
        name="category"
        label="Catégorie"
        options={[...PERSON_CATEGORIES]}
        allowEmpty={false}
      />
      <label className="login-field">
        Entreprise
        <select name="companyId" defaultValue={defaultCompanyId ?? ""}>
          <option value="">Aucune</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
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
        WhatsApp
        <input name="whatsapp" placeholder="+243 810 000 000" />
      </label>
      <label className="login-field">
        LinkedIn
        <input name="linkedin" />
      </label>
      <label className="login-field">
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter le contact"}
      </button>
    </form>
  );
}
