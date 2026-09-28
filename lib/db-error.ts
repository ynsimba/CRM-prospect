export function loginFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("SESSION_SECRET")) {
    return "SESSION_SECRET manquant (au moins 16 caractères).";
  }
  if (!process.env.LARAVEL_API_URL) {
    return "LARAVEL_API_URL manquant. Le backend Laravel doit utiliser MySQL safecheck_com.";
  }
  if (/laravel injoignable|econnrefused|fetch failed|enotfound|etimedout/i.test(message)) {
    return "Le backend Laravel ne répond pas. Lance npm run dev:api (MySQL MAMP, base safecheck_com, port 8889).";
  }
  if (/base table or view not found|n'existe pas|doesn't exist/i.test(message)) {
    return "Les tables n’existent pas encore. Lance npm run db:migrate puis npm run db:seed.";
  }
  return "Base de données indisponible. Vérifie MySQL (MAMP) et le serveur Laravel.";
}
