"use client";

import { useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, ShoppingBag, Heart, LogOut, Loader2 } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else if ((session.user as any).role === "ADMIN") {
        router.push("/admin");
      }
    }
  }, [session, isPending, router]);

  if (isPending || !session || (session.user as any).role === "ADMIN") {
    if (isPending) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-gold" size={48} />
        </div>
      );
    }
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const navLinks = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account/orders", label: "Orders", icon: ShoppingBag },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 lg:gap-16">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-card border border-border p-6 flex flex-col gap-6">
          <div className="pb-6 border-b border-border text-center">
            <div className="w-16 h-16 rounded-full bg-brand-gold text-black mx-auto mb-4 flex items-center justify-center font-serif text-2xl uppercase">
              {session.user.name?.[0] || session.user.email?.[0]}
            </div>
            <h2 className="font-bold uppercase tracking-widest text-sm text-white mb-1">{session.user.name}</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{session.user.email}</p>
          </div>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                    isActive ? "bg-brand-gold text-black" : "text-muted-foreground hover:bg-white hover:text-black"
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-border mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}
