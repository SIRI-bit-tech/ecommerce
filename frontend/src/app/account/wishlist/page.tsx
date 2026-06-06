"use client";

import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  images: { url: string }[];
}

interface WishlistItem {
  id: string;
  product: WishlistProduct;
}

interface GetWishlistData {
  wishlist: {
    id: string;
    items: WishlistItem[];
  } | null;
}

const GET_WISHLIST = gql`
  query GetWishlist {
    wishlist {
      id
      items {
        id
        product {
          id
          name
          slug
          basePrice
          salePrice
          isOnSale
          images {
            url
          }
        }
      }
    }
  }
`;

const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveFromWishlist($productId: ID!) {
    removeFromWishlist(productId: $productId) {
      id
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
      id
      totalItems
    }
  }
`;

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function WishlistPage() {
  const { data, loading, refetch } = useQuery<GetWishlistData>(GET_WISHLIST, {
    fetchPolicy: "cache-and-network",
  });

  const [removeFromWishlist] = useMutation(REMOVE_FROM_WISHLIST);
  const [addToCart] = useMutation(ADD_TO_CART);
  const { setIsOpen: setCartOpen } = useCartStore();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  const items = data?.wishlist?.items || [];

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist({ variables: { productId } });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart({ variables: { productId, quantity: 1 } });
      setCartOpen(true);
      handleRemove(productId); // Optionally remove from wishlist after adding to cart
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Please select variants on the product page.";
      alert(message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl uppercase tracking-widest border-b border-border pb-4">My Wishlist</h1>
      
      {items.length === 0 ? (
        <div className="bg-card border border-border p-12 flex flex-col items-center justify-center text-center gap-4">
          <p className="text-muted-foreground uppercase tracking-widest text-sm">Your wishlist is empty.</p>
          <Link href="/shop" className="mt-4 border border-brand-gold text-brand-gold px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold hover:text-black transition-colors">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: WishlistItem) => {
            const product = item.product;
            return (
              <div key={item.id} className="group block relative">
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
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                    <button 
                      onClick={() => handleAddToCart(product.id)}
                      className="bg-brand-gold text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold-light transition-colors w-3/4"
                    >
                      Add to Cart
                    </button>
                    <Link 
                      href={`/shop/${product.slug}`}
                      className="bg-white text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-200 transition-colors w-3/4 text-center"
                    >
                      View Details
                    </Link>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.preventDefault(); handleRemove(product.id); }}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-destructive text-white p-2 transition-colors z-20 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
