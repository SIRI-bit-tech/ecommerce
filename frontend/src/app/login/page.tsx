"use client";

import { useState } from "react";
import { signIn, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "verify">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await signIn.email({
        email,
        password,
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("not verified") || authError.status === 403) {
          // If the email isn't verified, trigger the OTP step
          await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
          setStep("verify");
        } else {
          setError(authError.message || "Failed to log in");
        }
      } else if (!data?.token) {
        // If login succeeded but no session was returned, they need to verify their email via OTP
        await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
        setStep("verify");
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await authClient.emailOtp.verifyEmail({ email, otp });

      if (authError) {
        setError(authError.message || "Invalid or expired verification code");
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
          <h1 className="font-serif text-3xl font-bold uppercase tracking-widest mb-2">
            {step === "login" ? "Welcome Back" : "Verify Email"}
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs">
            {step === "login" 
              ? "Enter your details to access your account" 
              : "We sent a 6-digit code to your email"}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 mb-6 text-sm text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        {step === "login" ? (
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
            <div className="mt-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand-gold font-bold hover:underline">
                Register
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Verification Code</label>
              <input
                type="text"
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-background border border-border p-3 text-center tracking-[0.5em] text-xl focus:border-brand-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-brand-gold text-black font-bold uppercase tracking-[0.15em] px-8 py-4 hover:bg-brand-gold-light transition-colors flex justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
