"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ArrowRight, Sparkles } from "lucide-react";

const GET_HOME_PRODUCTS = gql`
  query GetHomeProducts {
    featuredProducts(limit: 4) {
      id
      name
      slug
      category
      basePrice
      salePrice
      isOnSale
      images {
        url
        isPrimary
      }
    }
  }
`;

interface HomeProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  images: { url: string; isPrimary: boolean }[];
}

interface HomeData {
  featuredProducts: HomeProduct[];
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function Home() {
  const { data, loading } = useQuery<HomeData>(GET_HOME_PRODUCTS);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videos = [
    "/Make_it_realistic_and_the_link.mp4",
    "/A_hyper_realistic_documentary.mp4"
  ];

  // Pause video when user scrolls away from the hero section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              // Note: Browsers may block unmuted autoplay until user interacts with the page
              videoRef.current.play().catch(e => console.log("Autoplay blocked by browser:", e));
            } else {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [videoIndex]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative h-[85vh] w-full bg-black overflow-hidden flex items-center">
        <video
          ref={videoRef}
          key={videos[videoIndex]}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000"
          onEnded={() => setVideoIndex((prev) => (prev + 1) % videos.length)}
        >
          <source src={videos[videoIndex]} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-0" />
        
        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="max-w-3xl py-16">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white uppercase tracking-wider leading-[1.1] mb-6">
              The Ultimate<br />Expression<br />Of Style.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light mb-10 max-w-xl">
              Elevate your presence with curated luxury collections for men and women. 
              Precision tailoring meets contemporary elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/shop"
                className="bg-brand-gold hover:bg-brand-gold-light text-black font-bold uppercase tracking-[0.15em] px-8 py-4 flex items-center justify-center transition-colors text-sm"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories Band ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-wider text-white">
              Curated Lines
            </h2>
            <Link href="/shop" className="text-brand-gold uppercase tracking-widest text-xs font-bold flex items-center gap-1 hover:text-brand-gold-light transition-colors group">
              View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Male Wears", tag: "MALE_WEAR", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80" },
              { title: "Female Wears", tag: "FEMALE_WEAR", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" },
              { title: "Footwear & Fragrance", tag: "SHOE", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80" }
            ].map((cat, i) => (
              <Link key={i} href={`/shop?category=${cat.tag}`} className="group relative aspect-[4/5] bg-background border border-border overflow-hidden flex items-end p-8">
                <Image 
                  src={cat.image} 
                  alt={cat.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                
                <div className="relative z-20 w-full">
                  <h3 className="text-2xl font-serif font-bold uppercase text-white mb-2">{cat.title}</h3>
                  <div className="h-[2px] w-0 bg-brand-gold group-hover:w-full transition-all duration-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-wider text-white mb-4">
              Featured Pieces
            </h2>
            <div className="h-[2px] w-16 bg-brand-gold mx-auto" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[3/4] bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : (data?.featuredProducts?.length ?? 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data?.featuredProducts.map((product: { id: string; name: string; slug: string; basePrice: number; salePrice: number | null; isOnSale: boolean; images: { url: string }[] }) => (
                <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                  <div className="aspect-[3/4] bg-card border border-border mb-4 overflow-hidden relative">
                    {product.isOnSale && (
                      <div className="absolute top-4 left-4 bg-brand-gold text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 z-10">
                        Sale
                      </div>
                    )}
                    {product.images?.[0] ? (
                      <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground uppercase text-xs tracking-widest">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-1">{product.name}</h3>
                  <div className="flex gap-2 items-center">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-brand-gold font-bold">{formatNaira(product.salePrice)}</span>
                        <span className="text-muted-foreground line-through text-sm">{formatNaira(product.basePrice)}</span>
                      </>
                    ) : (
                      <span className="text-white font-bold">{formatNaira(product.basePrice)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 border border-border">
              <p>No featured products available.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border pt-20 pb-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <span className="font-serif font-bold text-2xl tracking-[0.2em] leading-none text-white block mb-4">
                REY&apos;S VOGUE
              </span>
              <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
                A premium fashion and lifestyle destination curating the finest in men&apos;s apparel, women&apos;s fashion, footwear, and exclusive fragrances.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Shop</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li><Link href="/shop?category=MALE_WEAR" className="hover:text-brand-gold transition-colors">Male Wears</Link></li>
                <li><Link href="/shop?category=FEMALE_WEAR" className="hover:text-brand-gold transition-colors">Female Wears</Link></li>
                <li><Link href="/shop?category=SHOE" className="hover:text-brand-gold transition-colors">Footwear</Link></li>
                <li><Link href="/shop?category=PERFUME" className="hover:text-brand-gold transition-colors">Fragrances</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Support</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li><Link href="/account" className="hover:text-brand-gold transition-colors">My Account</Link></li>
                <li><Link href="/account/orders" className="hover:text-brand-gold transition-colors">Track Order</Link></li>
                <li><Link href="#" className="hover:text-brand-gold transition-colors">Shipping & Returns</Link></li>
                <li><Link href="#" className="hover:text-brand-gold transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Rey&apos;s Vogue. All rights reserved.</p>
            <div className="flex gap-6 uppercase tracking-widest">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
