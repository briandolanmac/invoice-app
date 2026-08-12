export const DEV_AUTH_COOKIE = "tour-invoices-dev-auth";

export function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV === "development";
}
