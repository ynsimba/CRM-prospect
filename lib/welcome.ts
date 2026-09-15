const WELCOME_TIME_ZONE = "Africa/Kinshasa";

export function hourInTimeZone(date: Date, timeZone = WELCOME_TIME_ZONE) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? date.getHours());
}

export function timeOfDayGreeting(date = new Date(), timeZone = WELCOME_TIME_ZONE) {
  const hour = hourInTimeZone(date, timeZone);
  if (hour < 5) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function welcomeCivility(value?: string | null) {
  return value === "Mr" || value === "Mme" ? value : "";
}

export function welcomeDisplayName(name: string, civility?: string | null) {
  const trimmed = name.trim();
  const prefix = welcomeCivility(civility);
  if (!trimmed) return prefix;
  return prefix ? `${prefix} ${trimmed}` : trimmed;
}

export function welcomeMessage(
  name: string,
  date = new Date(),
  timeZone = WELCOME_TIME_ZONE,
  civility?: string | null,
) {
  const firstName = name.trim().split(/\s+/).filter(Boolean)[0] ?? "";
  const greeting = timeOfDayGreeting(date, timeZone);
  const labeled = welcomeDisplayName(firstName, civility);
  return labeled ? `${greeting}, ${labeled}` : greeting;
}
