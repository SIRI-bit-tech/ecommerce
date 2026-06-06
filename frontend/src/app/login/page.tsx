"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Failed to log in");
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold uppercase tracking-widest mb-2">Welcome Back</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs">Enter your details to access your account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 mb-6 text-sm text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-brand-gold text-black font-bold uppercase tracking-[0.15em] px-8 py-4 hover:bg-brand-gold-light transition-colors flex justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-gold font-bold hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
