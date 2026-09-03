/** Small, hand-maintained map since this app only ever has a couple of
 *  real accounts -- avoids depending on the unused profiles.display_name
 *  column, which isn't populated or read anywhere else in the app. */
const DISPLAY_NAMES: Record<string, string> = {
  "riedolan@me.com": "Rie",
  "briandolanmac@gmail.com": "Brian",
  "briandolanmac@me.com": "Brian",
};

export function getDisplayName(email: string | null | undefined) {
  if (!email) return null;
  return DISPLAY_NAMES[email.toLowerCase()] || null;
}
