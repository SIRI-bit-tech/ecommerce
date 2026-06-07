"use client";

import Link from "next/link";
import { useCartStore, useUIStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ShoppingBag, Heart, User, Search, Menu } from "lucide-react";

const GET_NAV_COUNTS = gql`
  query GetNavCounts {
    cart {
      totalItems
    }
  }
`;

interface NavData {
  cart: { totalItems: number } | null;
}

export function Navbar() {
  const { setIsOpen: setCartOpen } = useCartStore();
  const { setSidebarOpen } = useUIStore();
  const { data: session } = useSession();
  
  // We only fetch counts if user is logged in
  const { data } = useQuery<NavData>(GET_NAV_COUNTS, {
    skip: !session,
  });

  const cartCount = data?.cart?.totalItems || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 -ml-2 text-foreground"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center flex-1 md:flex-none">
          <span className="font-serif font-bold text-2xl tracking-[0.2em] leading-none">
            REY&apos;S VOGUE
          </span>
          <div className="h-[2px] w-12 bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-dark mt-1" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest uppercase">
          <Link href="/shop" className="hover:text-brand-gold transition-colors">Shop</Link>
          <div className="group relative cursor-pointer">
            <span className="hover:text-brand-gold transition-colors">Categories</span>
            <div className="absolute top-full left-0 pt-4 hidden group-hover:block">
              <div className="bg-card border border-border p-4 flex flex-col gap-3 min-w-[200px]">
                <Link href="/shop?category=MALE_WEAR" className="hover:text-brand-gold transition-colors">Men&apos;s Clothing</Link>
                <Link href="/shop?category=FEMALE_WEAR" className="hover:text-brand-gold transition-colors">Women&apos;s Clothing</Link>
                <Link href="/shop?category=SHOE" className="hover:text-brand-gold transition-colors">Shoes</Link>
                <Link href="/shop?category=SANDAL" className="hover:text-brand-gold transition-colors">Sandals & Pams</Link>
                <Link href="/shop?category=PERFUME" className="hover:text-brand-gold transition-colors">Perfumes</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:text-brand-gold transition-colors hidden md:block" aria-label="Search">
            <Search size={20} />
          </button>
          <Link href="/account/wishlist" className="p-2 hover:text-brand-gold transition-colors hidden sm:block">
            <Heart size={20} />
          </Link>
          <Link href="/account" className="p-2 hover:text-brand-gold transition-colors hidden sm:block">
            <User size={20} />
          </Link>
          <button 
            className="p-2 hover:text-brand-gold transition-colors relative"
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-brand-gold text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
