import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="dashboard-page">
      <div className="login-shell">
        <article className="dash-card login-card">
          <div className="sidebar-logo login-brand">
            <span className="logo-mark" aria-hidden>
              //
            </span>
            <span>Prospect</span>
          </div>
          <h1 className="login-title">Connexion</h1>
          <p className="card-sub">Prospect CRM — prospection commerciale</p>
          <LoginForm />
          <p className="login-hint">
            Comptes de test : admin@demo.cd / admin123 · jean@demo.cd / jean123
          </p>
        </article>
      </div>
    </div>
  );
}
