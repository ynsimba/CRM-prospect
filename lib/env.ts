export function getDatabaseUrl() {
  return (
    process.env["DATABASE_URL"] ||
    process.env["POSTGRES_PRISMA_URL"] ||
    process.env["POSTGRES_URL"] ||
    ""
  );
}

export function getSessionSecret() {
  return process.env["SESSION_SECRET"] || "";
}
