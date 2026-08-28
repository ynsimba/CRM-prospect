type CountUpProps = {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  format?: "plain" | "fr";
};

export default function CountUp({
  end,
  suffix = "",
  prefix = "",
  format = "plain",
}: CountUpProps) {
  const rounded = Math.round(end);
  const label = format === "fr" ? rounded.toLocaleString("fr-FR") : String(rounded);

  return (
    <>
      {prefix}
      {label}
      {suffix}
    </>
  );
}
