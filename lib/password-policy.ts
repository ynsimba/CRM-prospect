export const PASSWORD_MIN_LENGTH = 8;

/** Règles du changement de mot de passe par l’utilisateur lui-même ; `null` = saisie valide. */
export function passwordChangeError(input: { current: string; next: string; confirm: string }) {
  if (!input.current) return "Saisissez votre mot de passe actuel.";
  if (input.next.length < PASSWORD_MIN_LENGTH) {
    return `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (input.next === input.current) return "Le nouveau mot de passe doit être différent de l’actuel.";
  if (input.next !== input.confirm) return "La confirmation ne correspond pas au nouveau mot de passe.";
  return null;
}
