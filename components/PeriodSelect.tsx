"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_PERIODS, type DashboardPeriod } from "@/lib/dashboard-logic";

/** Période des graphiques du tableau de bord, portée par `?periode=` pour rester côté serveur. */
export default function PeriodSelect({ value, label }: { value: DashboardPeriod; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`period-select ${pending ? "is-pending" : ""}`} title="Prospects créés ou suivis sur la période">
      <span className="visually-hidden">{label}</span>
      <select
        value={value}
        aria-busy={pending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() => {
            router.replace(next === "mois" ? pathname : `${pathname}?periode=${next}`, { scroll: false });
          });
        }}
      >
        {DASHBOARD_PERIODS.map((period) => (
          <option key={period.id} value={period.id}>
            {period.label}
          </option>
        ))}
      </select>
      <i className="bi bi-chevron-down" aria-hidden />
    </label>
  );
}
