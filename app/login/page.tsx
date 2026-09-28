import Image from "next/image";
import LoginForm from "./LoginForm";

const HIGHLIGHTS = [
  { icon: "bi-kanban", title: "Pipeline en temps réel", text: "Chaque prospect, de la première prise de contact à la signature." },
  { icon: "bi-alarm", title: "Relances maîtrisées", text: "Tâches et rappels partagés entre agents et Direction." },
  { icon: "bi-graph-up-arrow", title: "Pilotage Direction", text: "Suivi des équipes et rapports consolidés." },
];

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-brand">
        <Image
          src="/logo.png"
          alt="Safecheck RDC"
          className="login-logo"
          width={1495}
          height={494}
          sizes="(max-width: 991.98px) 122px, 170px"
          loading="eager"
        />
        <div className="login-brand-inner" aria-hidden="true">
          <p className="login-brand-kicker">Safecheck RDC · SafeCom</p>
          <h2 className="login-brand-title">Pilotez votre prospection commerciale.</h2>
          <ul className="login-brand-list">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title}>
                <span className="login-brand-icon">
                  <i className={`bi ${item.icon}`} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-inner">
          <h1 className="login-title">Connexion</h1>
          <p className="login-sub">Accédez à votre espace de prospection.</p>
          <LoginForm />
          <p className="login-footnote">
            Mot de passe oublié ? Contactez la Direction pour le réinitialiser.
          </p>
        </div>
      </section>
    </main>
  );
}
