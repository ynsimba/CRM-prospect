import { La_Belle_Aurore } from "next/font/google";
import CountUp from "./CountUp";
import { timeOfDayGreeting, welcomeDisplayName } from "@/lib/welcome";

const slogan = La_Belle_Aurore({ weight: "400", subsets: ["latin"], display: "swap" });

type ProfileCardProps = {
  name: string;
  civility?: string | null;
  overdue: number;
};

type Point = [number, number];

function lerp(from: Point, to: Point, t: number): Point {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

/** Façade vitrée en perspective : un quadrilatère et sa trame de meneaux. */
function Facade({ quad, rows, cols, fill }: { quad: [Point, Point, Point, Point]; rows: number; cols: number; fill: string }) {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  const lines: [Point, Point][] = [];
  for (let row = 1; row < rows; row += 1) {
    lines.push([lerp(topLeft, bottomLeft, row / rows), lerp(topRight, bottomRight, row / rows)]);
  }
  for (let col = 1; col < cols; col += 1) {
    lines.push([lerp(topLeft, topRight, col / cols), lerp(bottomLeft, bottomRight, col / cols)]);
  }

  return (
    <g>
      <polygon points={quad.map((point) => point.join(",")).join(" ")} fill={fill} />
      {lines.map(([from, to], index) => (
        <line
          key={index}
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="0.7"
        />
      ))}
    </g>
  );
}

function BannerBuilding() {
  return (
    <svg
      className="welcome-banner-building"
      viewBox="0 0 300 130"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="wb-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eaf6f1" />
          <stop offset="1" stopColor="#cfe9e2" />
        </linearGradient>
        <linearGradient id="wb-lit" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#d6f1e6" />
          <stop offset="0.5" stopColor="#7cc4a4" />
          <stop offset="1" stopColor="#2f8a60" />
        </linearGradient>
        <linearGradient id="wb-shade" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#8fd0b6" />
          <stop offset="0.55" stopColor="#3f9a75" />
          <stop offset="1" stopColor="#1b6746" />
        </linearGradient>
        <linearGradient id="wb-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dff3ea" />
          <stop offset="1" stopColor="#9fd2bb" />
        </linearGradient>
        <linearGradient id="wb-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="300" height="130" fill="url(#wb-sky)" />
      <Facade quad={[[70, 62], [118, 46], [110, 150], [58, 150]]} rows={10} cols={4} fill="url(#wb-far)" />
      <Facade quad={[[134, 22], [215, -14], [196, 150], [96, 150]]} rows={15} cols={7} fill="url(#wb-lit)" />
      <Facade quad={[[215, -14], [300, 12], [300, 150], [196, 150]]} rows={15} cols={6} fill="url(#wb-shade)" />
      <polygon points="134,22 215,-14 208,58 118,86" fill="url(#wb-sheen)" />
      <g fill="#2f9e44">
        <circle cx="74" cy="126" r="20" fillOpacity="0.85" />
        <circle cx="104" cy="132" r="16" fill="#57b947" fillOpacity="0.9" />
        <circle cx="48" cy="134" r="16" fill="#1c7a35" fillOpacity="0.8" />
      </g>
    </svg>
  );
}

function BannerLeaves() {
  const leaf = "M0 0 C -17 -18 -17 -54 0 -78 C 17 -54 17 -18 0 0 Z";
  return (
    <svg className="welcome-banner-leaves" viewBox="0 0 90 130" preserveAspectRatio="xMinYMid slice" aria-hidden>
      <path d={leaf} transform="translate(14 150) rotate(-22) scale(1.5)" fill="#1c7a35" />
      <path d={leaf} transform="translate(46 152) rotate(12) scale(1.15)" fill="#2f9e44" />
      <path d={leaf} transform="translate(6 112) rotate(-48) scale(1.05)" fill="#57b947" fillOpacity="0.85" />
      <path d={leaf} transform="translate(60 146) rotate(40) scale(0.8)" fill="#8dc438" fillOpacity="0.7" />
    </svg>
  );
}

function Underline() {
  return (
    <svg viewBox="0 0 80 8" preserveAspectRatio="none" aria-hidden>
      <path d="M2 6 C 22 1 52 1 78 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function ProfileCard({ name, civility, overdue }: ProfileCardProps) {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Kinshasa",
  }).format(now);
  const today = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  const firstName = name.trim().split(/\s+/).filter(Boolean)[0] ?? "";
  const shortLabel = welcomeDisplayName(firstName, civility);
  const greeting = timeOfDayGreeting(now, "Africa/Kinshasa");
  // Le titre dit déjà « Bonjour » : le matin, la phrase d’accroche varie.
  const moment = greeting === "Bonjour" ? "Bonne matinée" : greeting;

  return (
    <article className="welcome-banner">
      <BannerLeaves />
      <div className="welcome-banner-copy">
        <h1 className="welcome-banner-title">
          <span className="welcome-banner-hello">Bonjour</span>
          {shortLabel ? <span className="welcome-banner-name">{shortLabel}</span> : null}
        </h1>
        <p className="welcome-banner-text">{moment} ! Voici un aperçu de vos activités commerciales.</p>
        <div className="welcome-banner-meta">
          <p className="welcome-banner-date">
            <i className="bi bi-calendar-event" aria-hidden />
            <time dateTime={now.toISOString().slice(0, 10)}>{today}</time>
          </p>
          {overdue > 0 ? (
            <p className="welcome-banner-alert">
              <i className="bi bi-exclamation-circle" aria-hidden />
              <CountUp end={overdue} duration={1000} /> relance{overdue > 1 ? "s" : ""} en retard
            </p>
          ) : null}
        </div>
      </div>

      <p className={`welcome-banner-slogan ${slogan.className}`}>
        <span>
          Des soins de <em>qualité.<Underline /></em>
        </span>
        <span>
          Des coûts <em>maîtrisés.<Underline /></em>
        </span>
      </p>
      <BannerBuilding />
    </article>
  );
}
