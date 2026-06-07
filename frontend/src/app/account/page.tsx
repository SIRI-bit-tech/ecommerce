"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AccountProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setPhoneNumber((session.user as any).phoneNumber || "");
      setAddress((session.user as any).address || "");
      setCity((session.user as any).city || "");
      setState((session.user as any).state || "");
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await authClient.updateUser({
      name,
      phoneNumber,
      address,
      city,
      state
    } as any);
    
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <h1 className="font-serif text-3xl uppercase tracking-widest">My Profile</h1>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-light"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(false)}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="bg-card border border-border p-8">
        <h2 className="font-bold uppercase tracking-widest text-brand-gold text-sm mb-6">Personal Information</h2>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={session?.user?.email || ""}
                  className="w-full bg-background border border-border p-3 opacity-50 text-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Fashion Ave"
                  className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-gold text-black font-bold uppercase tracking-[0.15em] px-8 py-3 hover:bg-brand-gold-light transition-colors flex justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
              <p className="text-white bg-background border border-border p-4">{session?.user?.name || "Not set"}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
              <p className="text-white bg-background border border-border p-4">{session?.user?.email}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Phone Number</label>
              <p className="text-white bg-background border border-border p-4">{(session?.user as any)?.phoneNumber || "Not set"}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Address</label>
              <p className="text-white bg-background border border-border p-4">{(session?.user as any)?.address || "Not set"}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">City</label>
              <p className="text-white bg-background border border-border p-4">{(session?.user as any)?.city || "Not set"}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">State / Province</label>
              <p className="text-white bg-background border border-border p-4">{(session?.user as any)?.state || "Not set"}</p>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-8">
          To update your email or password, please contact support.
        </p>
      </div>
    </div>
  );
}
