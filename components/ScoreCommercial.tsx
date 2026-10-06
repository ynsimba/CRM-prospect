import { initialsFromName } from "@/lib/crm";
import type { ScoreDetails } from "@/lib/performance";
import styles from "./ScoreCommercial.module.css";

const COULEURS = {
  rouge: "#e53935",
  orange: "#fb8c00",
  vert: "#43a047",
} as const;

const SIZE = 120;
const STROKE = 10;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;

/** Les trois composantes du score et leur poids maximal. */
const PARTS = [
  { key: "performance", label: "Avancement", max: 70 },
  { key: "efficience", label: "Signatures", max: 20 },
  { key: "volume", label: "Volume", max: 10 },
] as const;

const PHASES = [
  { key: "opportunite", label: "Opportunité" },
  { key: "lead", label: "Lead" },
  { key: "pipeline", label: "Pipeline" },
  { key: "finalise", label: "Finalisé" },
] as const;

export type ScoreCommercialProps = {
  nom: string;
  photoUrl?: string | null;
  /** Score sur 100. */
  score: number;
  couleur: keyof typeof COULEURS;
  /** Décomposition du score, affichée au survol ou au focus du parent. */
  details?: ScoreDetails;
};

function decimal(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

export default function ScoreCommercial({ nom, photoUrl, score, couleur, details }: ScoreCommercialProps) {
  const part = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
  const label = `${decimal(part)} %`;

  return (
    <figure className={styles.card}>
      <div className={styles.donut}>
        <svg className={styles.ring} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Score de ${nom} : ${label}`}>
          <circle className={styles.track} cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth={STROKE} />
          {part > 0 ? (
            <circle
              className={styles.part}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={COULEURS[couleur]}
              strokeWidth={STROKE}
              // pathLength ramène le tour complet à 100 : le tiret vaut directement le score.
              pathLength={100}
              strokeDasharray={`${part} 100`}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          ) : null}
        </svg>
        {photoUrl ? (
          // Data URL stockée sur le compte : next/image n’apporte rien pour ces petites images inline.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className={styles.photo} />
        ) : (
          <span className={`${styles.photo} ${styles.initials}`} aria-hidden>
            {initialsFromName(nom)}
          </span>
        )}
        {details ? (
          <div className={styles.details} role="tooltip">
            <p className={styles.detailsHead}>
              <strong>{nom}</strong>
              <span>{label}</span>
            </p>
            <ul className={styles.parts}>
              {PARTS.map(({ key, label: partLabel, max }) => (
                <li key={key}>
                  <span className={styles.partLabel}>{partLabel}</span>
                  <span className={styles.partValue}>
                    {decimal(details[key])} / {max}
                  </span>
                  <span className={styles.bar} aria-hidden>
                    <span style={{ width: `${Math.min(100, (details[key] / max) * 100)}%`, background: COULEURS[couleur] }} />
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.counts}>
              {plural(details.prospects, "prospect")} · {plural(details.phases.finalise, "signature")}
            </p>
            <ul className={styles.phases}>
              {PHASES.map(({ key, label: phaseLabel }) => (
                <li key={key}>
                  {phaseLabel} <strong>{details.phases[key]}</strong>
                </li>
              ))}
            </ul>
            {details.rejetes > 0 ? (
              <p className={styles.note}>
                {plural(details.rejetes, "rejeté")} non compté{details.rejetes > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.nom}>{nom}</span>
        <span className={styles.score}>{label}</span>
      </figcaption>
    </figure>
  );
}
