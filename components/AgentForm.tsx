"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { AgentFormState } from "@/app/actions/agents";
import { AGENT_STATUS_LABELS } from "@/lib/agent-cockpit-logic";
import { splitAgentName } from "@/lib/agent-logic";
import { STAFF_EMAIL_EXAMPLE, staffEmailFromName } from "@/lib/staff-email";

type Option = { id: string; name: string };

export type AgentFormValues = {
  name: string;
  email: string;
  phone: string | null;
  civility: string | null;
  teamId: string | null;
  zoneId: string | null;
  supervisorId: string | null;
  matricule: string | null;
  jobTitle: string | null;
  hiredAt: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  role: "SALES" | "TEAM_LEAD";
  photoUrl: string | null;
};

type AgentFormProps = {
  action: (state: AgentFormState, formData: FormData) => Promise<AgentFormState>;
  teams: Option[];
  zones: Option[];
  supervisors: Option[];
  agent?: AgentFormValues;
  submitLabel: string;
  onSuccess?: () => void;
};

const initialState: AgentFormState = {};
const PHOTO_SIZE = 256;

/** Square-crops and downsizes the picked image so the stored data URL stays small (~20–40 KB). */
async function resizePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    PHOTO_SIZE,
    PHOTO_SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function AgentForm({ action, teams, zones, supervisors, agent, submitLabel, onSuccess }: AgentFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialName = splitAgentName(agent?.name ?? "");
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [email, setEmail] = useState(agent?.email ?? "");
  // Follow the naming convention until the user types an address by hand.
  const [emailTouched, setEmailTouched] = useState(Boolean(agent));
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState(agent?.photoUrl ?? "");
  const [photoError, setPhotoError] = useState("");
  const ids = { first: useId(), last: useId(), email: useId(), password: useId(), photo: useId() };
  const isEdit = Boolean(agent);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  const suggested = staffEmailFromName(firstName, lastName);
  const emailValue = emailTouched ? email : suggested;

  return (
    <form action={formAction} className="product-form agent-form">
      <fieldset className="agent-fieldset">
        <legend>Informations RH</legend>

        <div className="agent-photo-row">
          <span className="agent-photo-preview" aria-hidden>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" />
            ) : (
              <i className="bi bi-person" />
            )}
          </span>
          <div>
            <label className="btn-soft" htmlFor={ids.photo}>
              <i className="bi bi-camera" aria-hidden /> {photo ? "Changer la photo" : "Ajouter une photo"}
            </label>
            <input
              id={ids.photo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPhotoError("");
                try {
                  setPhoto(await resizePhoto(file));
                } catch {
                  setPhotoError("Image illisible. Choisis un fichier PNG, JPEG ou WebP.");
                }
              }}
            />
            {photo ? (
              <button type="button" className="link-button agent-photo-remove" onClick={() => setPhoto("")}>
                Retirer
              </button>
            ) : null}
            {photoError ? <p className="login-error">{photoError}</p> : null}
            <input type="hidden" name="photoUrl" value={photo} />
          </div>
        </div>

        <div className="agent-form-row">
          <label className="login-field" htmlFor={ids.first}>
            Prénom
            <input id={ids.first} name="firstName" required autoComplete="off" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Neisse" />
          </label>
          <label className="login-field" htmlFor={ids.last}>
            Nom
            <input id={ids.last} name="lastName" required autoComplete="off" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Engani" />
          </label>
        </div>

        <div className="agent-form-row">
          <label className="login-field">
            Civilité
            <select name="civility" defaultValue={agent?.civility ?? "Mr"}>
              <option value="Mr">Mr</option>
              <option value="Mme">Mme</option>
            </select>
          </label>
          <label className="login-field">
            Matricule
            <input name="matricule" defaultValue={agent?.matricule ?? ""} placeholder="Attribué automatiquement" autoComplete="off" />
          </label>
        </div>

        <label className="login-field" htmlFor={ids.email}>
          E-mail professionnel
          <input
            id={ids.email}
            name="email"
            type="email"
            required
            value={emailValue}
            onChange={(event) => {
              setEmailTouched(true);
              setEmail(event.target.value.toLowerCase());
            }}
            placeholder={STAFF_EMAIL_EXAMPLE}
            pattern="[a-z]\.[a-z]+(?:[.\-][a-z]+)*@safecheck-rdc\.com"
            title={`Format : ${STAFF_EMAIL_EXAMPLE}`}
            autoCapitalize="none"
            spellCheck={false}
          />
          <span className="muted-line">
            Initiale du prénom + « . » + nom @safecheck-rdc.com
            {emailTouched && suggested && email !== suggested ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setEmailTouched(false);
                    setEmail("");
                  }}
                >
                  Utiliser {suggested}
                </button>
              </>
            ) : null}
          </span>
        </label>

        <div className="agent-form-row">
          <label className="login-field">
            Téléphone
            <input name="phone" type="tel" defaultValue={agent?.phone ?? ""} placeholder="+243 810 000 000" />
          </label>
          <label className="login-field">
            Fonction
            <input name="jobTitle" defaultValue={agent?.jobTitle ?? ""} placeholder="Délégué commercial" />
          </label>
        </div>

        <div className="agent-form-row">
          <label className="login-field">
            Date d’intégration
            <input name="hiredAt" type="date" defaultValue={agent?.hiredAt ?? ""} />
          </label>
          <label className="login-field">
            Statut
            <select name="status" defaultValue={agent?.status ?? "ACTIVE"}>
              {(["ACTIVE", "SUSPENDED", "INACTIVE"] as const).map((status) => (
                <option key={status} value={status}>
                  {AGENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="agent-fieldset">
        <legend>Informations commerciales</legend>
        <div className="agent-form-row">
          <label className="login-field">
            Rôle
            <select name="role" defaultValue={agent?.role ?? "SALES"}>
              <option value="SALES">Délégué commercial</option>
              <option value="TEAM_LEAD">Responsable commercial</option>
            </select>
          </label>
          <label className="login-field">
            Équipe
            <select name="teamId" defaultValue={agent?.teamId ?? ""}>
              <option value="">Aucune équipe</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="agent-form-row">
          <label className="login-field">
            Responsable / superviseur
            <select name="supervisorId" defaultValue={agent?.supervisorId ?? ""}>
              <option value="">Aucun</option>
              {supervisors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="login-field">
            Zone commerciale
            <select name="zoneId" defaultValue={agent?.zoneId ?? ""}>
              <option value="">Aucune zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <label className="login-field" htmlFor={ids.password}>
        {isEdit ? "Nouveau mot de passe" : "Mot de passe"}
        <span className="agent-password">
          <input
            id={ids.password}
            name="password"
            type={showPassword ? "text" : "password"}
            required={!isEdit}
            minLength={6}
            autoComplete="new-password"
            placeholder={isEdit ? "Laisser vide pour ne pas changer" : "6 caractères minimum"}
          />
          <button
            type="button"
            className="agent-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-controls={ids.password}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden />
          </button>
        </span>
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
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
