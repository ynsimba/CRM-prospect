export function parseMonth(value: string | undefined, now = new Date()) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (match) {
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year: Number(match[1]), month };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("fr-CD", { month: "long", year: "numeric" });
}

export default function MonthPicker({ year, month }: { year: number; month: number }) {
  const value = `${year}-${String(month).padStart(2, "0")}`;
  return (
    <form method="get" className="cockpit-filters is-inline">
      <label className="cockpit-filter">
        <span>Mois</span>
        <input type="month" name="mois" defaultValue={value} />
      </label>
      <button type="submit" className="btn-soft">
        Afficher
      </button>
    </form>
  );
}
