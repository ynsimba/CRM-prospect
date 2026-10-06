"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, type PasswordFormState } from "@/app/actions/profile";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: PasswordFormState = {};

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";

  return (
    <form action={formAction} className="product-form password-form">
      <label className="login-field">
        Mot de passe actuel
        <input name="current" type={type} autoComplete="current-password" required />
      </label>
      <label className="login-field">
        Nouveau mot de passe
        <input name="next" type={type} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required />
        <small className="muted-line">Au moins {PASSWORD_MIN_LENGTH} caractères, différent de l’actuel.</small>
      </label>
      <label className="login-field">
        Confirmer le nouveau mot de passe
        <input name="confirm" type={type} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required />
      </label>
      <label className="password-show">
        <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
        Afficher les mots de passe
      </label>
      {state.error ? (
        <p className="login-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-success" role="status">
          {state.success}
        </p>
      ) : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
