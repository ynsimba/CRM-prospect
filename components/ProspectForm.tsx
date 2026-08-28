"use client";

import { useActionState } from "react";
import { createProspectAction, type ProspectFormState } from "@/app/actions/prospects";
import { PERSON_CATEGORIES, PRIORITY_LABELS } from "@/lib/crm";
import SearchSelect from "@/components/SearchSelect";

const initialState: ProspectFormState = {};

type Option = { id: string; name: string };

type ProspectFormProps = {
  statuses: Option[];
  sources: Option[];
  tags: Option[];
  companies: Option[];
  owners: Option[];
  defaultStatusId?: string;
  defaultOwnerId?: string;
};

export default function ProspectForm({
  statuses,
  sources,
  tags,
  companies,
  owners,
  defaultStatusId,
  defaultOwnerId,
}: ProspectFormProps) {
  const [state, formAction, pending] = useActionState(createProspectAction, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Prénom
        <input name="firstName" required placeholder="Jean" />
      </label>
      <label className="login-field">
        Nom
        <input name="lastName" required placeholder="Tshisekedi" />
      </label>
      <label className="login-field">
        Fonction
        <input name="jobTitle" placeholder="DAF, acheteur…" />
      </label>
      <SearchSelect
        name="category"
        label="Catégorie"
        options={[...PERSON_CATEGORIES]}
        allowEmpty={false}
      />
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
        Ville
        <input name="city" placeholder="Kinshasa" defaultValue="Kinshasa" />
      </label>
      <label className="login-field">
        Statut
        <select name="statusId" required defaultValue={defaultStatusId ?? statuses[0]?.id ?? ""}>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Source
        <select name="sourceId" defaultValue="">
          <option value="">Non renseignée</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
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
        Priorité
        <select name="priority" defaultValue="NORMAL">
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {tags.length > 0 ? (
        <fieldset className="login-field">
          <legend>Tags</legend>
          <div className="tag-checks">
            {tags.map((tag) => (
              <label key={tag.id}>
                <input type="checkbox" name="tagIds" value={tag.id} /> {tag.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="login-field">
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter le prospect"}
      </button>
    </form>
  );
}
