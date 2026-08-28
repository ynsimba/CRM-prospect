import CountUp from "./CountUp";

type ProfileCardProps = {
  name: string;
  initials: string;
  roleLabel: string;
  overdue: number;
};

export default function ProfileCard({
  name,
  initials,
  roleLabel,
  overdue,
}: ProfileCardProps) {
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <article className="dash-card profile-card">
      <div className="profile-top">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div>
          <h2 className="profile-name">{name}</h2>
          <p className="profile-welcome">{roleLabel}</p>
        </div>
      </div>
      <div className="profile-footer">
        <span>
          <CountUp end={overdue} duration={1200} /> RELANCES
        </span>
        <span>{today.toUpperCase()}</span>
      </div>
    </article>
  );
}
