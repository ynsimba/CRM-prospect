"use client";

import { useActionState } from "react";
import {
  assignTeamAction,
  createTeamAction,
  saveGoalAction,
  type TeamFormState,
} from "@/app/actions/team";

const initialState: TeamFormState = {};

export function TeamCreateForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Nom de l’équipe
        <input name="name" required placeholder="Gombe, Terrain…" />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "…" : "Créer l’équipe"}
      </button>
    </form>
  );
}

export function TeamAssignForm({
  users,
  teams,
}: {
  users: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignTeamAction, initialState);
  return (
    <form action={formAction} className="product-form">
      <label className="login-field">
        Commercial
        <select name="userId" required defaultValue={users[0]?.id ?? ""}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Équipe
        <select name="teamId" defaultValue="">
          <option value="">Aucune</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "…" : "Affecter"}
      </button>
    </form>
  );
}

export function GoalForm({
  users,
  year,
  month,
}: {
  users: { id: string; name: string }[];
  year: number;
  month: number;
}) {
  const [state, formAction, pending] = useActionState(saveGoalAction, initialState);
  return (
    <form action={formAction} className="product-form">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <label className="login-field">
        Commercial
        <select name="userId" required defaultValue={users[0]?.id ?? ""}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <label className="login-field">
        Prospects
        <input name="prospectsTarget" inputMode="numeric" placeholder="15" />
      </label>
      <label className="login-field">
        Rendez-vous
        <input name="meetingsTarget" inputMode="numeric" placeholder="8" />
      </label>
      <label className="login-field">
        Opportunités
        <input name="opportunitiesTarget" inputMode="numeric" placeholder="5" />
      </label>
      <label className="login-field">
        CA (FC)
        <input name="revenueTarget" inputMode="numeric" placeholder="40 000 000" />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn-download" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer l’objectif"}
      </button>
    </form>
  );
}
