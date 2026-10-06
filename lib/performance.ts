import "server-only";

import { loadAgents, requireAgentScope } from "@/lib/agents";
import { canManageAgents } from "@/lib/roles";
import type { SessionPayload } from "@/lib/session";

export type CouleurScore = "rouge" | "orange" | "vert";

/** Décomposition du score, affichée au survol du donut. */
export type ScoreDetails = {
  /** Avancement des prospects, sur 70. */
  performance: number;
  /** Signatures rapportées au meilleur commercial, sur 20. */
  efficience: number;
  /** Taille du portefeuille rapportée au plus gros, sur 10. */
  volume: number;
  /** Prospects comptés dans le score (hors rejetés). */
  prospects: number;
  rejetes: number;
  phases: { opportunite: number; lead: number; pipeline: number; finalise: number };
};

export type ScoreCommercialRow = {
  id: string;
  nom: string;
  photoUrl: string | null;
  /** Score sur 100, arrondi à une décimale. */
  score: number;
  couleur: CouleurScore;
  details: ScoreDetails;
};

/** Scores calculés par Laravel (PerformanceService) sur tous les commerciaux de l’organisation. */
async function fetchScores(organizationId: string): Promise<ScoreCommercialRow[]> {
  const base = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000";
  const token = process.env.LARAVEL_INTERNAL_TOKEN || "";
  let response: Response;
  try {
    response = await fetch(`${base}/api/commerciaux/performance?organizationId=${encodeURIComponent(organizationId)}`, {
      headers: { Accept: "application/json", "X-Internal-Token": token },
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    throw new Error(`Laravel injoignable (${base}). ${message}`);
  }
  const json = (await response.json().catch(() => ({}))) as { data?: ScoreCommercialRow[]; message?: string };
  if (!response.ok) throw new Error(json.message || "Erreur Laravel");
  return json.data ?? [];
}

/** Classement de tous les commerciaux de l’organisation, visible par tous les comptes : meilleur score d’abord. */
export async function loadScoresCommerciaux(session: SessionPayload): Promise<ScoreCommercialRow[]> {
  const scores = await fetchScores(session.organizationId);
  return scores.sort((a, b) => b.score - a.score || a.nom.localeCompare(b.nom, "fr"));
}

/** Commerciaux dont ce compte peut ouvrir la fiche du cockpit (Direction : tous, responsable : son équipe). */
export async function fichesAccessibles(session: SessionPayload): Promise<string[]> {
  if (!canManageAgents(session.role)) return [];
  return (await loadAgents(await requireAgentScope())).map((agent) => agent.id);
}
