type LegendItem = {
  color: string;
  label: string;
};

const fallback = [
  { color: "#fcb040", label: "Espèces" },
  { color: "#12a197", label: "Mobile Money" },
  { color: "#2f3990", label: "Crédit" },
];

export default function ChartLegend({ items = fallback }: { items?: LegendItem[] }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <div className="legend-item" key={item.label}>
          <span className="legend-swatch" style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
