"use client";

import { deleteProspectAction } from "@/app/actions/prospects";

export default function ProspectDeleteButton({
  prospectId,
  prospectName,
}: {
  prospectId: string;
  prospectName: string;
}) {
  return (
    <form
      action={deleteProspectAction.bind(null, prospectId)}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Supprimer définitivement « ${prospectName} » ?\n\nL’historique de statuts lié sera retiré. Les opportunités, activités et tâches associées resteront sans lien prospect. Cette action est irréversible.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <button type="submit" className="table-action is-danger">
        Supprimer
      </button>
    </form>
  );
}
