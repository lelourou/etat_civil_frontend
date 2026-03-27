/**
 * Transforme une réponse d'erreur DRF en message lisible :
 * - Supprime accolades, guillemets, crochets et noms de champs
 * - N'affiche que les messages texte, séparés par " — "
 */
export function formatApiError(err: any): string {
  if (!err) return 'Une erreur est survenue.';
  if (typeof err === 'string') return err;

  const messages: string[] = [];

  const extraire = (obj: any) => {
    if (typeof obj === 'string') { messages.push(obj); return; }
    if (Array.isArray(obj))     { obj.forEach(m => extraire(m)); return; }
    if (obj && typeof obj === 'object') {
      for (const val of Object.values(obj)) extraire(val);
    }
  };

  if (err.detail && typeof err.detail === 'string') return err.detail;
  extraire(err);
  return messages.length ? messages.join(' — ') : 'Une erreur est survenue.';
}
