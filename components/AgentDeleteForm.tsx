"use client";

import { useActionState } from "react";
import { deleteAgentAction, type AgentFormState } from "@/app/actions/agents";

const initialState: AgentFormState = {};

export default function AgentDeleteForm({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [state, formAction, pending] = useActionState(deleteAgentAction.bind(null, agentId), initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Supprimer définitivement ${agentName} ?\n\nSes prospects, entreprises et contacts resteront dans le CRM, sans agent attribué. Cette action est irréversible.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      {state.error ? (
        <p className="login-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn-danger-soft" disabled={pending}>
        <i className="bi bi-trash3" aria-hidden /> {pending ? "Suppression…" : "Supprimer l’agent"}
      </button>
    </form>
  );
}
