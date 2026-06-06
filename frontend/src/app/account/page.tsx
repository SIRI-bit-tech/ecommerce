"use client";

import { useSession } from "@/lib/auth-client";

export default function AccountProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl uppercase tracking-widest border-b border-border pb-4">My Profile</h1>
      
      <div className="bg-card border border-border p-8">
        <h2 className="font-bold uppercase tracking-widest text-brand-gold text-sm mb-6">Personal Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
            <p className="text-white bg-background border border-border p-4">{session?.user?.name || "Not set"}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
            <p className="text-white bg-background border border-border p-4">{session?.user?.email}</p>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-8">
          To update your email or password, please contact support.
        </p>
      </div>
    </div>
  );
}
