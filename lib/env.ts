export function getSessionSecret() {
  return process.env["SESSION_SECRET"] || "";
}
