"use client";

import { useActionState, useMemo, useState } from "react";
import { assignProspectsAction, type AgentFormState } from "@/app/actions/agents";
import { ASSIGNMENT_MODE_LABELS } from "@/lib/agent-cockpit-logic";
import type { AssignmentMode } from "@/lib/enums";

export type AssignableProspect = {
  id: string;
  label: string;
  code: string | null;
  company: string | null;
  city: string | null;
  status: string;
  ownerName: string | null;
};

type AgentOption = { id: string; name: string; load: number };

const initialState: AgentFormState = {};

export default function AssignForm({
  prospects,
  agents,
  defaultAgentId = "",
  reassign = false,
  allowAuto = false,
  defaultMode = "LOAD",
  excludeAgentId,
}: {
  prospects: AssignableProspect[];
  agents: AgentOption[];
  defaultAgentId?: string;
  reassign?: boolean;
  allowAuto?: boolean;
  defaultMode?: AssignmentMode;
  excludeAgentId?: string;
}) {
  const [state, formAction, pending] = useActionState(assignProspectsAction, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [mode, setMode] = useState<AssignmentMode>(defaultMode === "MANUAL" ? "LOAD" : defaultMode);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return prospects;
    return prospects.filter((item) =>
      `${item.label} ${item.company ?? ""} ${item.city ?? ""} ${item.code ?? ""} ${item.ownerName ?? ""}`.toLowerCase().includes(q),
    );
  }, [filter, prospects]);

  const targets = agents.filter((agent) => agent.id !== excludeAgentId);
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selected.has(item.id));
  const targetName = agentId === "auto" ? null : targets.find((agent) => agent.id === agentId)?.name;
  const count = selected.size;
  const verb = reassign ? "Réaffecter" : "Affecter";
  const label =
    count === 0
      ? "Sélectionne des prospects"
      : agentId === "auto"
        ? `Distribuer ${count} prospect${count > 1 ? "s" : ""} (${ASSIGNMENT_MODE_LABELS[mode]})`
        : targetName
          ? `${verb} ${count} prospect${count > 1 ? "s" : ""} à ${targetName}`
          : "Choisis un agent";

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((item) => next.delete(item.id));
      else visible.forEach((item) => next.add(item.id));
      return next;
    });
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setSelected(new Set());
      }}
      className="assign-form"
    >
      {reassign ? <input type="hidden" name="reassign" value="1" /> : null}
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="prospectIds" value={id} />
      ))}

      <div className="assign-bar">
        <label className="cockpit-filter grow">
          <span>Filtrer la liste</span>
          <input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Nom, entreprise, ville, code…" />
        </label>
        <label className="cockpit-filter">
          <span>{reassign ? "Nouveau responsable" : "Agent destinataire"}</span>
          <select name="agentId" value={agentId} onChange={(event) => setAgentId(event.target.value)} required>
            <option value="">Choisir…</option>
            {allowAuto ? <option value="auto">Distribution automatique</option> : null}
            {targets.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.load} actifs)
              </option>
            ))}
          </select>
        </label>
        {agentId === "auto" ? (
          <label className="cockpit-filter">
            <span>Mode</span>
            <select name="mode" value={mode} onChange={(event) => setMode(event.target.value as AssignmentMode)}>
              {(["ROUND_ROBIN", "LOAD", "ZONE"] as const).map((item) => (
                <option key={item} value={item}>
                  {ASSIGNMENT_MODE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="cockpit-filter grow">
          <span>Motif (facultatif)</span>
          <input name="reason" maxLength={250} placeholder={reassign ? "Ex. absence de Sarah" : "Ex. campagne octobre"} />
        </label>
      </div>

      <div className="assign-submit">
        <button type="submit" className="btn-download" disabled={pending || count === 0 || !agentId}>
          <i className="bi bi-person-check" aria-hidden /> {pending ? "Enregistrement…" : label}
        </button>
        <span className="muted-line">
          {count} sélectionné{count > 1 ? "s" : ""} sur {prospects.length}
        </span>
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

      {prospects.length === 0 ? (
        <p className="empty-copy">Aucun prospect à afficher.</p>
      ) : (
        <div className="table-wrap assign-table">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="check-col">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label={allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  />
                </th>
                <th scope="col">Prospect</th>
                <th scope="col">Entreprise</th>
                <th scope="col">Ville</th>
                <th scope="col">Statut</th>
                <th scope="col">Responsable actuel</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className={selected.has(item.id) ? "is-selected" : undefined} onClick={() => toggle(item.id)}>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Sélectionner ${item.label}`}
                    />
                  </td>
                  <td>
                    <strong>{item.label}</strong>
                    {item.code ? <span className="muted-line"> #{item.code}</span> : null}
                  </td>
                  <td>{item.company ?? "—"}</td>
                  <td>{item.city ?? "—"}</td>
                  <td>{item.status}</td>
                  <td>{item.ownerName ?? <span className="muted-line">Non affecté</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}
