/** Only these accounts can see or use the password-admin tooling, even
 *  though every other page treats every signed-in account the same.
 *  Fails closed: any account not explicitly listed here is denied,
 *  including any new account created later. Brian's explicit ask: Rie
 *  shouldn't be able to change anyone's password, including her own,
 *  from inside the app. */
const ADMIN_ALLOWED_EMAILS = ["briandolanmac@gmail.com", "briandolanmac@me.com"];

export function canAccessAdmin(email: string | null | undefined) {
  if (!email) return false;
  return ADMIN_ALLOWED_EMAILS.includes(email.toLowerCase());
}
