"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="login-form">
      <label className="login-field">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue="admin@demo.cd"
        />
      </label>
      <label className="login-field">
        Mot de passe
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      <button type="submit" className="btn-download login-submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
