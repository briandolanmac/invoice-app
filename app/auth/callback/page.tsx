"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Confirms the link Supabase emailed the user (password reset, or
 *  historically a magic link) and routes on to the right next page.
 *
 *  This project's browser Supabase client (@supabase/ssr's
 *  createBrowserClient) uses the PKCE flow, not the older implicit flow.
 *  For a PKCE link, the email points here with a `?code=...` query param
 *  (never a `#access_token=...` hash) and the client AUTO-EXCHANGES that
 *  code for a session as soon as it's constructed (detectSessionInUrl),
 *  firing a PASSWORD_RECOVERY auth event for a reset link specifically --
 *  there is nothing to parse from the URL ourselves. The old code here
 *  only ever looked at the hash, so for a real PKCE link `type` was
 *  always null and it fell straight through to `router.replace("/")`
 *  before the async exchange had even finished -- landing on /login
 *  with no session, which looked like the link "did nothing." */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);

    const urlError = url.searchParams.get("error_description") || url.searchParams.get("error");
    if (urlError) {
      router.replace(`/login?error=${encodeURIComponent(urlError)}`);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
      } else if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });

    // Older implicit-flow links (if one ever shows up) carry the session
    // directly in the URL hash instead of a `code` param.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        } else if (hashType === "recovery") {
          router.replace("/reset-password");
        } else {
          router.replace("/");
        }
      });
    } else if (!url.searchParams.get("code")) {
      // No code, no hash tokens -- not a link we know how to handle.
      router.replace("/login");
    }

    // Safety net: an expired/already-used link exchanges with an error
    // that onAuthStateChange never fires for, so don't leave the user
    // stuck on "Finishing sign-in..." forever.
    const timeout = setTimeout(() => {
      setMessage("This link may have expired. Please request a new one.");
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="page" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 440, padding: 28, width: "100%" }}>
        <p className="muted">{message}</p>
      </section>
    </main>
  );
}
