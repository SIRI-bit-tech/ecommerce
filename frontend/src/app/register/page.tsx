"use client";

import { useState } from "react";
import { signUp, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await signUp.email({
        email,
        password,
        name,
        phoneNumber,
        address,
        fetchOptions: {
          body: { fullName: name },
        },
      } as any);

      if (authError) {
        setError(authError.message || "Failed to register");
      } else {
        // Send OTP email
        await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
        setStep("verify");
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
            {step === "register" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs">
            {step === "register"
              ? "Join Rey's Vogue for an exclusive experience"
              : "We sent a 6-digit code to your email"}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 mb-6 text-sm text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        {step === "register" ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none"
              />
            </div>
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
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Continue"}
            </button>
            <div className="mt-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-gold font-bold hover:underline">
                Log In
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
