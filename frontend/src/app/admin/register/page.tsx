"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const REGISTER_ADMIN = gql`
  mutation RegisterAdmin($email: String!, $password: String!, $fullName: String!) {
    registerAdmin(email: $email, password: $password, fullName: $fullName) {
      id
      email
      fullName
    }
  }
`;

export default function AdminRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [registerAdmin, { loading }] = useMutation(REGISTER_ADMIN, {
    onCompleted: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to register administrator.");
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      return;
    }
    if (!email.includes("@")) {
      setError("Valid email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    registerAdmin({
      variables: {
        email,
        password,
        fullName,
      },
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[70vh]">
      <div className="w-full max-w-md bg-card border border-border p-8">
        <div className="text-center mb-8">
          <span className="text-brand-gold text-xs font-bold tracking-[0.25em] uppercase block mb-2">Management Setup</span>
          <h1 className="font-serif text-3xl font-bold uppercase tracking-widest mb-2">Register Admin</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px]">Create the master administrator account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 mb-6 text-xs text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-3 mb-6 text-xs text-center uppercase tracking-widest font-bold">
            Registration successful! Redirecting to login...
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-brand-gold text-black font-bold uppercase tracking-[0.15em] px-8 py-4 hover:bg-brand-gold-light transition-colors flex justify-center disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Register Admin"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Already have an admin account?{" "}
          <Link href="/admin/login" className="text-brand-gold font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
