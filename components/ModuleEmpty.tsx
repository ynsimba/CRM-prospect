import Shell from "@/components/Shell";

export default function ModuleEmpty({
  title,
  subtitle,
  empty,
  activeHref,
}: {
  title: string;
  subtitle: string;
  empty: string;
  activeHref: string;
}) {
  return (
    <Shell activeHref={activeHref}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="card-sub">{subtitle}</p>
        </div>
      </div>
      <article className="dash-card">
        <p className="empty-copy">{empty}</p>
      </article>
    </Shell>
  );
}
