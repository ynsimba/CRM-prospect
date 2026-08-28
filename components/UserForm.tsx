"use client";

import { useActionState } from "react";
import { createUserAction, type UserFormState } from "@/app/actions/users";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";

const initialState: UserFormState = {};

export default function UserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom
        <input name="name" required placeholder="Grace Ilunga" />
      </label>
      <label className="login-field">
        E-mail
        <input name="email" type="email" required placeholder="jean@demo.cd" />
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
