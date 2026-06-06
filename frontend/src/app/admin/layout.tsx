"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
      </div>
    );
  }

  if (!session) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  // Enforce ADMIN role check to prevent customer access
  if ((session.user as any).role !== "ADMIN") {
    if (typeof window !== "undefined") router.push("/");
    return null;
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/ticker", label: "Promo Ticker", icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-card border border-border p-6 flex flex-col gap-6">
          <div className="pb-6 border-b border-border">
            <h2 className="font-serif font-bold uppercase tracking-widest text-brand-gold text-xl">Admin Panel</h2>
          </div>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}
