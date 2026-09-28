"use client";

import { useActionState, useId, useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { STAFF_EMAIL_EXAMPLE } from "@/lib/staff-email";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const emailHintId = useId();
  const passwordId = useId();

  return (
    <form action={formAction} className="login-form">
      {state.error ? (
        <p className="login-alert" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="login-control">
        <label htmlFor={emailId}>Adresse e-mail</label>
        <div className="login-input">
          <i className="bi bi-envelope" aria-hidden />
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={STAFF_EMAIL_EXAMPLE}
            defaultValue={state.email}
            aria-describedby={emailHintId}
            aria-invalid={state.error ? true : undefined}
            required
          />
        </div>
        <p className="login-hint-line" id={emailHintId}>
          Initiale du prénom + nom, ex. {STAFF_EMAIL_EXAMPLE}
        </p>
      </div>

      <div className="login-control">
        <label htmlFor={passwordId}>Mot de passe</label>
        <div className="login-input">
          <i className="bi bi-lock" aria-hidden />
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={state.error ? true : undefined}
            required
          />
          <button
            type="button"
            className="login-eye"
            onClick={() => setShowPassword((value) => !value)}
            aria-controls={passwordId}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden />
          </button>
        </div>
      </div>

      <button type="submit" className="login-submit" disabled={pending}>
        {pending ? (
          <>
            <span className="login-spinner" aria-hidden />
            Connexion…
          </>
        ) : (
          <>
            Se connecter
            <i className="bi bi-arrow-right" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
