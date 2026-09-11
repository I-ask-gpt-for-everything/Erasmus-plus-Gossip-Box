"use client";

import { useState, FormEvent } from "react";
import { adminLogin } from "@/lib/adminAuth";
import { isFirebaseConfigured } from "@/lib/postsStore";

// Firebase Authentication needs an email identifier, but this app only ever
// has one admin account, so the login screen asks for just a password and
// signs in with this fixed email behind the scenes — still real Firebase
// Auth, still enforced server-side by the admins/{uid} allowlist in
// firestore.rules, just one less field to type.
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "alex.papailiiopoulos@gmail.com";

export default function AdminLogin() {
  const [passcode, setPasscode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = isFirebaseConfigured
      ? await adminLogin({ mode: "firebase", email: ADMIN_EMAIL, password })
      : await adminLogin({ mode: "local", passcode });
    setLoading(false);
    if (!result.ok) setError(result.error ?? "Login failed.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
      >
        <h1 className="text-lg font-semibold text-white">Admin sign in</h1>

        {isFirebaseConfigured ? (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        ) : (
          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-40"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
