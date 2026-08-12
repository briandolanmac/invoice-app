"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    async function finishAuth() {
      const supabase = createClient();
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      if (type === "recovery") {
        router.replace("/reset-password");
        return;
      }

      router.replace("/");
    }

    finishAuth().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Could not finish sign-in.");
    });
  }, [router]);

  return (
    <main className="page" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 440, padding: 28, width: "100%" }}>
        <p className="muted">{message}</p>
      </section>
    </main>
  );
}
