export function loginFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (message.includes("SESSION_SECRET")) {
    return "SESSION_SECRET manquant sur Vercel (au moins 16 caractères).";
  }
  if (!process.env.DATABASE_URL) {
    return "DATABASE_URL manquant sur Vercel. Branche une Postgres (Neon, Supabase ou Vercel Postgres).";
  }
  if (code === "P1001" || code === "P1017" || /can't reach database|econnrefused|etimedout/i.test(message)) {
    return "Impossible de joindre la base. Vérifie DATABASE_URL (hôte, mot de passe, sslmode=require).";
  }
  if (code === "P2021" || code === "P2022" || /does not exist/i.test(message)) {
    return "Les tables n’existent pas encore. Exécute prisma migrate deploy puis prisma db seed sur cette base.";
  }
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "Connexion à la base impossible. Ajoute DATABASE_URL et SESSION_SECRET dans Vercel, puis relance un déploiement.";
  }
  return "Base de données indisponible. Lance npm run db:up puis npm run db:reset.";
}
