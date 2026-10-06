"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ScoreCommercial from "@/components/ScoreCommercial";
import type { ScoreCommercialRow } from "@/lib/performance";
import styles from "./ScoresCommerciaux.module.css";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: ScoreCommercialRow[]; fiches: string[] };

const SKELETONS = 4;

export default function ScoresCommerciaux({ className = "" }: { className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // Session expirée = redirection vers /login : « manual » évite de lire sa page HTML comme du JSON.
    fetch("/api/commerciaux/performance", {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ data: ScoreCommercialRow[]; fiches?: string[] }>;
      })
      .then((json) => setState({ status: "ready", rows: json.data, fiches: json.fiches ?? [] }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return (
    <section
      className={`dash-card agents-board ${styles.board} ${className}`.trim()}
      aria-labelledby="scores-commerciaux-title"
    >
      <div className="card-head-row">
        <div>
          <h3 id="scores-commerciaux-title">Performance des commerciaux</h3>
          <p className="card-sub">
            Score sur 100 : avancement des prospects (70 %), signatures (20 %) et volume du portefeuille (10 %).
          </p>
        </div>
      </div>

      {state.status === "loading" ? (
        <ul className={styles.grid} aria-busy="true" aria-label="Chargement des scores">
          {Array.from({ length: SKELETONS }, (_, index) => (
            <li key={index} className={styles.skeleton} aria-hidden>
              <span className={styles.skeletonRing} />
              <span className={styles.skeletonLine} />
            </li>
          ))}
        </ul>
      ) : null}

      {state.status === "error" ? (
        <div className={styles.error} role="alert">
          <p>Impossible de charger les scores pour le moment.</p>
          <button type="button" className="btn-soft" onClick={retry}>
            Réessayer
          </button>
        </div>
      ) : null}

      {state.status === "ready" && state.rows.length === 0 ? (
        <p className="empty-copy">Aucun commercial à afficher.</p>
      ) : null}

      {state.status === "ready" && state.rows.length > 0 ? (
        <ul className={styles.grid}>
          {state.rows.map((row) => {
            const donut = (
              <ScoreCommercial
                nom={row.nom}
                photoUrl={row.photoUrl}
                score={row.score}
                couleur={row.couleur}
                details={row.details}
              />
            );
            return (
              <li key={row.id}>
                {state.fiches.includes(row.id) ? (
                  <Link href={`/direction/agents/${row.id}`} className={`${styles.item} ${styles.link}`}>
                    {donut}
                  </Link>
                ) : (
                  // Focalisable : le détail du score reste accessible au clavier sans lien vers la fiche.
                  <div className={styles.item} tabIndex={0}>
                    {donut}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
