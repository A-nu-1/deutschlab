"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function OwnerLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Login failed.");
        return;
      }

      setPassword("");
      router.replace("/admin/review");
      router.refresh();
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11131f] px-5 text-white">
      <section className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-[#1c2030] p-7 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-4xl">🔐</div>

          <h1 className="mt-3 text-2xl font-semibold text-violet-300">
            DeutschLab Owner
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your learning library.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="owner-password"
            className="block text-sm font-medium text-slate-200"
          >
            Owner password
          </label>

          <input
            id="owner-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#11131f] px-4 py-3 text-white outline-none transition focus:border-violet-400"
            placeholder="Enter your password"
          />

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          The public learning library remains open to everyone.
        </p>
      </section>
    </main>
  );
}