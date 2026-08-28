export function formatFc(amount: number) {
  return `${new Intl.NumberFormat("fr-CD", { maximumFractionDigits: 0 }).format(amount)} FC`;
}
