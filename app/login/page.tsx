import LoginForm from "./LoginForm";
import { DEMO_STAFF_EMAILS } from "@/lib/staff-email";

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
            Comptes de test
            <br />
            Admin : {DEMO_STAFF_EMAILS.admin.email} / admin123
            <br />
            Direction : {DEMO_STAFF_EMAILS.direction.email} / manager123
            <br />
            Délégué commercial : {DEMO_STAFF_EMAILS.jean.email} / jean123
          </p>
        </article>
      </div>
    </div>
  );
}
