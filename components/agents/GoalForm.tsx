"use client";

import { useActionState } from "react";
import { saveGoalsAction, type AgentFormState } from "@/app/actions/agents";
import { GOAL_METRICS, type GoalTargets } from "@/lib/agent-cockpit-logic";
import { GOAL_VISUALS } from "@/components/agents/GoalsBoard";

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
      {compact ? null : (
        <div className="goal-fields">
          {GOAL_METRICS.map((metric) => {
            const visual = GOAL_VISUALS[metric.key];
            return (
              <label key={metric.key} className={`goal-field accent-${visual.accent}`}>
                <span className="goal-field-icon" aria-hidden>
                  <i className={`bi ${visual.icon}`} />
                </span>
                <span className="goal-field-body">
                  <span className="goal-field-label">{metric.label}</span>
                  <span className="goal-field-input">
                    <input
                      name={metric.target}
                      type="number"
                      min={0}
                      step={metric.key === "revenue" ? 1000 : 1}
                      inputMode="numeric"
                      defaultValue={targets[metric.target] || ""}
                      placeholder="0"
                    />
                    <span className="goal-field-unit">{visual.unit}</span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
      <div className="goal-inputs" hidden={!compact}>
        {(compact ? GOAL_METRICS : []).map((metric) => (
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
          {pending ? (
            "…"
          ) : compact ? (
            "Enregistrer"
          ) : (
            <>
              <i className="bi bi-check2-circle" aria-hidden /> Enregistrer les objectifs
            </>
          )}
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
