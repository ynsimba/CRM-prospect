"use client";

import { useActionState, useEffect, useId, useState, useTransition, type FormEvent } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { STAFF_EMAIL_EXAMPLE } from "@/lib/staff-email";

const initialState: LoginState = {};
/** Seul l’e-mail est mémorisé sur le poste : la session, elle, expire toujours. */
const EMAIL_KEY = "safecheck.loginEmail";

export default function LoginForm({ hubUrl }: { hubUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeField, setActiveField] = useState<"email" | "password">("email");
  const emailId = useId();
  const emailHintId = useId();
  const passwordId = useId();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(EMAIL_KEY);
      if (saved) {
        // localStorage is only readable after hydration: reading it during render would mismatch the SSR HTML.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      // Mode privé : pas de mémorisation.
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    // Lancée à la main, l’action ne réinitialise pas le formulaire : la case et l’e-mail restent en place après un échec.
    event.preventDefault();
    try {
      const value = email.trim();
      if (remember && value) window.localStorage.setItem(EMAIL_KEY, value);
      else window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      // Quota / mode privé : la connexion continue sans mémorisation.
    }
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form action={formAction} className="login-form" onSubmit={submit}>
      {state.error ? (
        <p className="login-alert" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden />
          {state.error}
        </p>
      ) : null}
      {showHelp ? (
        <p className="login-alert is-info" role="status">
          <i className="bi bi-info-circle" aria-hidden />
          Mot de passe oublié ? Contactez la Direction pour le réinitialiser.
        </p>
      ) : null}

      <div className={`login-control ${activeField === "email" ? "is-active" : ""}`}>
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onFocus={() => setActiveField("email")}
            aria-describedby={emailHintId}
            aria-invalid={state.error ? true : undefined}
            required
          />
        </div>
        <p className="visually-hidden" id={emailHintId}>
          Initiale du prénom + nom, ex. {STAFF_EMAIL_EXAMPLE}
        </p>
      </div>

      <div className={`login-control ${activeField === "password" ? "is-active" : ""}`}>
        <label htmlFor={passwordId}>Mot de passe</label>
        <div className="login-input">
          <i className="bi bi-lock" aria-hidden />
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            onFocus={() => setActiveField("password")}
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

      <div className="login-options">
        <label className="login-remember">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>Se souvenir de moi</span>
        </label>
        <button
          type="button"
          className="login-forgot"
          aria-expanded={showHelp}
          onClick={() => setShowHelp((value) => !value)}
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div className="login-actions">
        <button type="submit" className="login-submit" disabled={pending}>
          {pending ? (
            <>
              <span className="login-spinner" aria-hidden />
              Connexion…
            </>
          ) : (
            <>
              Connexion
              <i className="bi bi-arrow-right" aria-hidden />
            </>
          )}
        </button>
        <a className="login-hub" href={hubUrl}>
          <i className="bi bi-arrow-left" aria-hidden />
          Retourner sur Safecheck-Hub
        </a>
      </div>
    </form>
  );
}
