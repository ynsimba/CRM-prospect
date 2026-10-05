"use client";

import { useActionState, useState } from "react";
import { createContactAction, type ContactFormState } from "@/app/actions/contacts";
import { CIVILITIES, PERSON_CATEGORIES } from "@/lib/crm";

const initialState: ContactFormState = {};

type ContactFormProps = {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  defaultCategory?: string;
};

export default function ContactForm({ companies, defaultCompanyId, defaultCategory = "contact" }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(createContactAction, initialState);
  const [category, setCategory] = useState(defaultCategory);
  const isPorteur = category === "porteur";
  const companyRequired = !isPorteur && !defaultCompanyId;

  return (
    <form action={formAction} className="product-form contact-form">
      <div className="form-row form-row-identity">
        <label className="login-field">
          Titre
          <select name="civility" defaultValue="" aria-label="Titre">
            <option value="">—</option>
            {CIVILITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="login-field">
          Prénom
          <input name="firstName" required placeholder="Patrick" autoComplete="given-name" />
        </label>
        <label className="login-field">
          Nom
          <input name="lastName" required placeholder="Mwamba" autoComplete="family-name" />
        </label>
      </div>

      <div className="form-row form-row-2">
        <label className="login-field">
          Fonction
          <input name="jobTitle" placeholder="Directeur commercial" autoComplete="organization-title" />
        </label>
        <label className="login-field">
          Catégorie
          <select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {PERSON_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="login-field">
        <span>
          Entreprise
          {isPorteur ? (
            <span className="muted-line"> Optionnel pour un porteur de projet</span>
          ) : (
            <span className="req" aria-hidden>
              {" "}
              *
            </span>
          )}
        </span>
        <select name="companyId" defaultValue={defaultCompanyId ?? ""} required={companyRequired}>
          <option value="">{isPorteur ? "Sans entreprise" : "Choisir une entreprise"}</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-row form-row-2">
        <label className="login-field">
          E-mail
          <input name="email" type="email" placeholder="pmwamba@abc-sarl.cd" autoComplete="email" />
        </label>
        <label className="login-field">
          Téléphone
          <input name="phone" type="tel" placeholder="+243 810 000 000" autoComplete="tel" />
        </label>
      </div>

      <div className="form-row form-row-2">
        <label className="login-field">
          WhatsApp
          <input name="whatsapp" type="tel" placeholder="+243 810 000 000" />
        </label>
        <label className="login-field">
          LinkedIn
          <input name="linkedin" placeholder="linkedin.com/in/…" autoComplete="url" />
        </label>
      </div>

      <label className="login-field">
        Notes
        <textarea name="notes" rows={3} placeholder="Contexte, décisionnaire, prochaine étape…" />
      </label>

      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <div className="form-actions">
        <button type="submit" className="btn-download" disabled={pending}>
          {pending ? "Enregistrement…" : isPorteur ? "Ajouter le porteur" : "Ajouter le contact"}
        </button>
      </div>
    </form>
  );
}
