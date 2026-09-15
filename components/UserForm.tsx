"use client";

import { useActionState, useEffect } from "react";
import { createUserAction, type UserFormState } from "@/app/actions/users";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import { STAFF_EMAIL_EXAMPLE } from "@/lib/staff-email";

const initialState: UserFormState = {};

export default function UserForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom
        <input name="name" required placeholder="Grace Ilunga" />
      </label>
      <label className="login-field">
        Civilité
        <select name="civility" defaultValue="Mr">
          <option value="Mr">Mr</option>
          <option value="Mme">Mme</option>
        </select>
      </label>
      <label className="login-field">
        E-mail
        <input
          name="email"
          type="email"
          required
          placeholder={STAFF_EMAIL_EXAMPLE}
          pattern="[a-z]\.[a-z]+(?:[.\-][a-z]+)*@safecheck-rdc\.com"
          title={STAFF_EMAIL_EXAMPLE}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.toLowerCase();
          }}
        />
        <span className="muted-line">Format : {STAFF_EMAIL_EXAMPLE}</span>
      </label>
      <label className="login-field">
        Mot de passe
        <input name="password" type="password" required minLength={6} />
      </label>
      <label className="login-field">
        Rôle
        <select name="role" defaultValue="SALES">
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <span className="muted-line">Admin, Direction ou Délégué commercial</span>
      </label>
      <label className="login-field">
        Téléphone
        <input name="phone" placeholder="+243 810 000 000" />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter l’utilisateur"}
      </button>
    </form>
  );
}
