"use client";

import { useMemo, useState } from "react";

type CompanyOption = { id: string; name: string };

export default function CompanyNameField({
  companies,
  defaultName = "",
  defaultCompanyId = "",
}: {
  companies: CompanyOption[];
  defaultName?: string;
  defaultCompanyId?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const needle = name.trim().toLowerCase();
  const matches = useMemo(() => {
    if (needle.length < 2) return [];
    return companies.filter((item) => item.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [companies, needle]);
  const exact = companies.find((item) => item.name.toLowerCase() === needle);

  return (
    <div className="login-field">
      <span>
        Nom entreprise
        <span className="req" aria-hidden>
          {" "}
          *
        </span>
      </span>
      <input
        name="companyName"
        required
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setCompanyId("");
        }}
        placeholder="Rechercher ou saisir une entreprise"
        autoComplete="off"
      />
      <input type="hidden" name="companyId" value={companyId} />
      {exact && !companyId ? (
        <p className="login-error">Cette entreprise existe déjà. Sélectionnez-la ci-dessous pour ouvrir la fiche existante.</p>
      ) : null}
      {matches.length > 0 ? (
        <div className="search-select-options" style={{ position: "static", marginTop: 8 }}>
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`search-select-pill ${item.id === companyId ? "is-selected" : ""}`}
              onClick={() => {
                setName(item.name);
                setCompanyId(item.id);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
