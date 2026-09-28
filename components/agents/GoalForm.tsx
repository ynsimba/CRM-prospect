"use client";

import { useActionState } from "react";
import { saveGoalsAction, type AgentFormState } from "@/app/actions/agents";
import { GOAL_METRICS, type GoalTargets } from "@/lib/agent-cockpit-logic";

const initialState: AgentFormState = {};

export default function GoalForm({
  owner,
  year,
  month,
  targets,
  compact = false,
  label,
}: {
  owner: { userId: string } | { teamId: string };
  year: number;
  month: number;
  targets: GoalTargets;
  compact?: boolean;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(saveGoalsAction, initialState);
  return (
    <form action={formAction} className={compact ? "goal-form is-compact" : "goal-form"}>
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      {"userId" in owner ? <input type="hidden" name="userId" value={owner.userId} /> : <input type="hidden" name="teamId" value={owner.teamId} />}
      <div className="goal-inputs">
        {GOAL_METRICS.map((metric) => (
          <label key={metric.key} className="login-field">
            <span className={compact ? "visually-hidden" : undefined}>
              {metric.label}
              {metric.key === "revenue" ? " (FC)" : ""}
              {label ? ` — ${label}` : ""}
            </span>
            <input
              name={metric.target}
              type="number"
              min={0}
              step={metric.key === "revenue" ? 1000 : 1}
              inputMode="numeric"
              defaultValue={targets[metric.target] || ""}
              placeholder="0"
            />
          </label>
        ))}
      </div>
      <div className="goal-form-foot">
        <button type="submit" className="btn-download" disabled={pending}>
          {pending ? "…" : compact ? "Enregistrer" : "Enregistrer les objectifs"}
        </button>
        {state.error ? (
          <span className="login-error" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.success ? (
          <span className="form-success" role="status">
            {state.success}
          </span>
        ) : null}
      </div>
    </form>
  );
}
