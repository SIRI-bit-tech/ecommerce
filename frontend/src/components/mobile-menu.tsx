"use client";

import { useUIStore } from "@/lib/store";
import { X, Search, Heart, User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function MobileMenu() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200"
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-background border-r border-border z-[70] flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-brand-gold text-black">
          <span className="font-serif font-bold tracking-widest uppercase">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 -mr-2 hover:bg-black/10 rounded transition-colors" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-card border border-border py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-brand-gold rounded-sm"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 uppercase tracking-widest text-sm font-bold">
            <Link onClick={() => setSidebarOpen(false)} href="/shop" className="p-3 bg-card border border-border hover:border-brand-gold transition-colors flex justify-between items-center">
              <span>All Shop</span>
            </Link>
            
            <div className="pt-4 pb-2 text-xs text-brand-gold">Categories</div>
            <Link onClick={() => setSidebarOpen(false)} href="/shop?category=MALE_WEAR" className="p-3 border-b border-border/50 hover:text-brand-gold transition-colors">Men's Clothing</Link>
            <Link onClick={() => setSidebarOpen(false)} href="/shop?category=FEMALE_WEAR" className="p-3 border-b border-border/50 hover:text-brand-gold transition-colors">Women's Clothing</Link>
            <Link onClick={() => setSidebarOpen(false)} href="/shop?category=SHOE" className="p-3 border-b border-border/50 hover:text-brand-gold transition-colors">Shoes</Link>
            <Link onClick={() => setSidebarOpen(false)} href="/shop?category=SANDAL" className="p-3 border-b border-border/50 hover:text-brand-gold transition-colors">Sandals & Pams</Link>
            <Link onClick={() => setSidebarOpen(false)} href="/shop?category=PERFUME" className="p-3 border-b border-border/50 hover:text-brand-gold transition-colors">Perfumes</Link>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-4 border-t border-border pt-6">
            <Link onClick={() => setSidebarOpen(false)} href="/account" className="flex items-center gap-3 text-sm hover:text-brand-gold transition-colors">
              <User size={18} />
              <span>My Account</span>
            </Link>
            <Link onClick={() => setSidebarOpen(false)} href="/account/wishlist" className="flex items-center gap-3 text-sm hover:text-brand-gold transition-colors">
              <Heart size={18} />
              <span>Wishlist</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
