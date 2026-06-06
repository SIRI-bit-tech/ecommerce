"use client";

import { useState, Suspense } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  images: { url: string }[];
}

const GET_PRODUCTS = gql`
  query GetProducts($filters: ProductFilterInput, $pagination: PaginationInput) {
    products(filters: $filters, pagination: $pagination) {
      products {
        id
        name
        slug
        basePrice
        salePrice
        isOnSale
        images {
          url
          isPrimary
        }
      }
      pageInfo {
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

interface ShopPageData {
  products: {
    products: ShopProduct[];
    pageInfo: {
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  } | null;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");

  const { data, loading, error } = useQuery<ShopPageData>(GET_PRODUCTS, {
    variables: {
      filters: {
        category,
        search: search || undefined,
      },
      pagination: {
        page,
        limit: 12,
      },
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) params.set("search", searchTerm);
    else params.delete("search");
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("category", cat);
    else params.delete("category");
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-widest">Shop</h1>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold border border-border px-4 py-2 hover:bg-white hover:text-black transition-colors"
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-background border-r border-border p-6 transform transition-transform duration-300 ease-in-out
        md:relative md:inset-0 md:w-64 md:border-none md:p-0 md:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex justify-between items-center md:hidden mb-8">
          <h2 className="font-serif font-bold text-xl uppercase tracking-widest">Filters</h2>
          <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>

        <div className="mb-10">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-b border-border py-2 pr-8 focus:outline-none focus:border-brand-gold text-sm placeholder:text-muted-foreground uppercase tracking-widest"
            />
            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-gold">
              <Search size={16} />
            </button>
          </form>
        </div>

        <div className="mb-10">
          <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 border-b border-border pb-2">Categories</h3>
          <ul className="flex flex-col gap-4 text-sm text-muted-foreground uppercase tracking-widest">
            <li>
              <button onClick={() => setCategory(null)} className={`hover:text-brand-gold transition-colors ${!category ? 'text-brand-gold font-bold' : ''}`}>
                All Products
              </button>
            </li>
            <li>
              <button onClick={() => setCategory("MALE_WEAR")} className={`hover:text-brand-gold transition-colors ${category === 'MALE_WEAR' ? 'text-brand-gold font-bold' : ''}`}>
                Male Wears
              </button>
            </li>
            <li>
              <button onClick={() => setCategory("FEMALE_WEAR")} className={`hover:text-brand-gold transition-colors ${category === 'FEMALE_WEAR' ? 'text-brand-gold font-bold' : ''}`}>
                Female Wears
              </button>
            </li>
            <li>
              <button onClick={() => setCategory("SHOE")} className={`hover:text-brand-gold transition-colors ${category === 'SHOE' ? 'text-brand-gold font-bold' : ''}`}>
                Shoes
              </button>
            </li>
            <li>
              <button onClick={() => setCategory("SANDAL")} className={`hover:text-brand-gold transition-colors ${category === 'SANDAL' ? 'text-brand-gold font-bold' : ''}`}>
                Sandals & Pams
              </button>
            </li>
            <li>
              <button onClick={() => setCategory("PERFUME")} className={`hover:text-brand-gold transition-colors ${category === 'PERFUME' ? 'text-brand-gold font-bold' : ''}`}>
                Perfumes
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <h1 className="hidden md:block text-4xl font-serif font-bold uppercase tracking-widest mb-10 border-b border-border pb-4">
          {category ? category.replace("_", " ") : "The Collection"}
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 border border-destructive text-destructive text-center uppercase tracking-widest font-bold">
            Failed to load collection.
          </div>
        ) : data?.products?.products.length === 0 ? (
          <div className="p-16 border border-border text-center flex flex-col items-center">
            <h2 className="font-serif text-2xl uppercase tracking-widest mb-4">No results found</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => { setCategory(null); setSearchTerm(""); router.push("/shop"); }}
              className="mt-8 border border-brand-gold text-brand-gold px-6 py-2 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold hover:text-black transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {data?.products?.products.map((product: ShopProduct) => (
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">{product.name}</h3>
                  <div className="flex gap-2 items-center text-sm">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-brand-gold font-bold">{formatNaira(product.salePrice)}</span>
                        <span className="text-muted-foreground line-through">{formatNaira(product.basePrice)}</span>
                      </>
                    ) : (
                      <span className="text-white font-bold">{formatNaira(product.basePrice)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {(data?.products?.pageInfo?.totalPages ?? 0) > 1 && (
              <div className="flex justify-center gap-2 pt-8 border-t border-border">
                {data?.products?.pageInfo?.hasPreviousPage && (
                  <button 
                    onClick={() => setPage(page - 1)}
                    className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors"
                  >
                    Prev
                  </button>
                )}
                <span className="flex items-center px-4 text-xs font-bold tracking-widest text-muted-foreground">
                  {page} / {data?.products?.pageInfo?.totalPages}
                </span>
                {data?.products?.pageInfo?.hasNextPage && (
                  <button 
                    onClick={() => setPage(page + 1)}
                    className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[3/4] bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
