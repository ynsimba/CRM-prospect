import Image from "next/image";
import LoginForm from "./LoginForm";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "https://hub.safecheckrdc.com/";

const HIGHLIGHTS = [
  { icon: "bi-kanban", title: "Pipeline commercial", text: "Temps réel" },
  { icon: "bi-alarm", title: "Relances et tâches", text: "Maîtrisées" },
  { icon: "bi-graph-up-arrow", title: "Pilotage Direction", text: "Consolidé" },
];

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-frame">
        <aside className="login-visual">
          <Image
            className="login-photo"
            src="/login-commercial.jpg"
            alt=""
            width={1400}
            height={2100}
            sizes="(max-width: 900px) 1px, 420px"
          />
          <div className="login-shape login-shape-ring" aria-hidden="true" />
          <div className="login-shape login-shape-glow" aria-hidden="true" />
          <div className="login-pitch">
            <p className="login-kicker">Pilotage commercial</p>
            <h1 className="login-pitch-title">
              Une prospection
              <br />
              <em>plus simple,</em>
              <br />
              plus efficace.
            </h1>
            <p className="login-lead">
              Suivez vos prospects, gérez vos relances
              <br />
              et pilotez vos ventes, en toute simplicité.
            </p>
            <ul className="login-highlights">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title}>
                  <span className="login-highlight-icon">
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="login-panel" aria-label="Connexion">
          <div className="login-brand-row">
            <Image
              src="/logo-navy.png"
              alt="Safecheck RDC"
              className="login-logo login-logo-light"
              width={1495}
              height={494}
              sizes="240px"
              loading="eager"
            />
            <Image
              src="/logo.png"
              alt="Safecheck RDC"
              className="login-logo login-logo-dark"
              width={1495}
              height={494}
              sizes="240px"
              loading="eager"
            />
            <p className="login-sub-brand">Prospection commerciale</p>
          </div>

          <LoginForm hubUrl={HUB_URL} />
        </section>
      </div>
    </main>
  );
}
