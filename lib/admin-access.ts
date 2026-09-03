/** Accounts that should never see or use the password-admin tooling,
 *  even though every other page treats every signed-in account the same.
 *  Brian's explicit ask: Rie shouldn't be able to change anyone's
 *  password, including her own, from inside the app. */
const RESTRICTED_EMAILS = ["riedolan@me.com"];

export function canAccessAdmin(email: string | null | undefined) {
  if (!email) return false;
  return !RESTRICTED_EMAILS.includes(email.toLowerCase());
}
