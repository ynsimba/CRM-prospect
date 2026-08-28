"use client";

import { useActionState } from "react";
import {
  commitImportAction,
  previewImportAction,
  type ImportFormState,
} from "@/app/actions/import";
import { IMPORT_FIELDS } from "@/lib/import-logic";

const empty: ImportFormState = {};

function issueLabel(issue: NonNullable<NonNullable<ImportFormState["rows"]>[number]["issue"]>) {
  if (issue === "missing-name") return "Prénom et nom requis";
  if (issue === "invalid-email") return "E-mail invalide";
  if (issue === "duplicate-file") return "Doublon dans le fichier";
  return "Doublon déjà en base";
}

export default function ImportWizard() {
  const [preview, previewForm, previewPending] = useActionState(previewImportAction, empty);
  const [commit, commitForm, commitPending] = useActionState(commitImportAction, empty);
  const headers = preview.headers ?? [];
  const mapping = preview.mapping ?? {};
  const rows = preview.rows ?? [];
  const stats = preview.stats;
  const pending = previewPending || commitPending;
  const shown = rows.slice(0, 30);
  const error = preview.error || commit.error;

  return (
    <form className="product-form">
      <article className="dash-card" style={{ marginBottom: 16 }}>
        <h3>1. Fichier et mapping</h3>
        <p className="card-sub">CSV (virgule ou point-virgule), UTF-8, 500 lignes max. Analyse obligatoire avant import.</p>
        <label className="login-field">
          Fichier CSV
          <input name="file" type="file" accept=".csv,text/csv,text/plain" required />
        </label>
        {headers.length > 0 ? (
          <div className="row g-2">
            {IMPORT_FIELDS.map((field) => (
              <div className="col-md-4 col-lg-3" key={field.key}>
                <label className="login-field">
                  {field.label}
                  <select name={`map-${field.key}`} defaultValue={mapping[field.key] ?? ""}>
                    <option value="">—</option>
                    {headers.map((header) => (
                      <option key={`${field.key}-${header}`} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        ) : null}
        {error ? <p className="login-error">{error}</p> : null}
        {commit.success ? <p className="form-success">{commit.success}</p> : null}
        <button type="submit" className="btn-download" formAction={previewForm} disabled={pending}>
          {previewPending ? "Analyse…" : headers.length ? "Réanalyser" : "Analyser"}
        </button>
      </article>

      {stats ? (
        <article className="dash-card">
          <h3>2. Prévisualisation</h3>
          <p className="card-sub">
            {stats.total} ligne{stats.total > 1 ? "s" : ""} · {stats.ready} prête
            {stats.ready > 1 ? "s" : ""} · {stats.duplicateDb + stats.duplicateFile} doublon
            {stats.duplicateDb + stats.duplicateFile > 1 ? "s" : ""} · {stats.errors} erreur
            {stats.errors > 1 ? "s" : ""}
          </p>
          {shown.length === 0 ? (
            <p className="empty-copy">Rien à afficher.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Prospect</th>
                    <th>Entreprise</th>
                    <th>Contact</th>
                    <th>Contrôle</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={row.line}>
                      <td>{row.line}</td>
                      <td>
                        <strong>
                          {row.firstName} {row.lastName}
                        </strong>
                        <div className="muted-line">{row.city || "—"}</div>
                      </td>
                      <td>{row.company || "—"}</td>
                      <td>
                        {row.email || row.phone || row.whatsapp || "—"}
                        <div className="muted-line">{[row.source, row.owner].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td>
                        {row.issue ? (
                          <span className="status-pill off">{issueLabel(row.issue)}</span>
                        ) : (
                          <span className="status-pill on">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > shown.length ? (
            <p className="muted-line" style={{ marginTop: 8 }}>
              {rows.length - shown.length} autres lignes non affichées.
            </p>
          ) : null}
          <label className="login-field" style={{ marginTop: 16 }}>
            Doublons
            <select name="skipDuplicates" defaultValue="yes">
              <option value="yes">Ignorer les doublons</option>
              <option value="no">Importer aussi les doublons</option>
            </select>
          </label>
          <button
            type="submit"
            className="btn-download"
            formAction={commitForm}
            disabled={pending || stats.total === stats.errors}
          >
            {commitPending ? "Import…" : "Lancer l’import"}
          </button>
        </article>
      ) : null}
    </form>
  );
}
