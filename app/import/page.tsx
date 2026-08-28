import Link from "next/link";
import Shell from "@/components/Shell";
import ImportWizard from "@/components/ImportWizard";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ImportPage() {
  await requirePermission(PERMISSIONS.prospectsManage);

  return (
    <Shell activeHref="/import">
      <div className="page-head">
        <div>
          <h1 className="page-title">Import CSV</h1>
          <p className="card-sub">Analyse, mapping, doublons, puis import — jamais à l’aveugle.</p>
        </div>
        <div className="page-head-actions">
          <Link href="/import/modele" className="table-action">
            Modèle CSV
          </Link>
          <Link href="/prospects/export" className="btn-download">
            Exporter
          </Link>
        </div>
      </div>
      <ImportWizard />
    </Shell>
  );
}
