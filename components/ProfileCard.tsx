import CountUp from "./CountUp";
import { welcomeDisplayName, welcomeMessage } from "@/lib/welcome";

type ProfileCardProps = {
  name: string;
  initials: string;
  civility?: string | null;
  overdue: number;
};

export default function ProfileCard({ name, initials, civility, overdue }: ProfileCardProps) {
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Kinshasa",
  }).format(new Date());

  return (
    <article className="dash-card profile-card">
      <div className="profile-top">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div>
          <h2 className="profile-name">{welcomeDisplayName(name, civility)}</h2>
          <p className="profile-welcome">{welcomeMessage(name, new Date(), "Africa/Kinshasa", civility)}</p>
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
