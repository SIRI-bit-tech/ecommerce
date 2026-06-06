"use client";

import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useCartStore } from "@/lib/store";
import { X, Trash2, Plus, Minus, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface CartItemData {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    basePrice: number;
    salePrice: number | null;
    isOnSale: boolean;
    images: { url: string }[];
  };
  variant: { id: string; size: string | null; color: string | null } | null;
}

interface CartData {
  cart: {
    id: string;
    totalItems: number;
    subtotal: number;
    items: CartItemData[];
  } | null;
}

const GET_CART = gql`
  query GetCartDetails {
    cart {
      id
      totalItems
      subtotal
      items {
        id
        quantity
        product {
          id
          name
          basePrice
          salePrice
          isOnSale
          images {
            url
          }
        }
        variant {
          id
          size
          color
        }
      }
    }
  }
`;

const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
    updateCartItem(cartItemId: $cartItemId, quantity: $quantity) {
      id
      subtotal
      totalItems
      items {
        id
        quantity
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartItemId: ID!) {
    removeFromCart(cartItemId: $cartItemId) {
      id
      subtotal
      totalItems
    }
  }
`;

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function CartSidebar() {
  const { isOpen, setIsOpen } = useCartStore();
  const { data: session } = useSession();

  const { data, loading } = useQuery<CartData>(GET_CART, {
    skip: !session || !isOpen, // Only fetch when open to save bandwidth, or keep cached
    fetchPolicy: "cache-and-network",
  });

  const [updateItem] = useMutation(UPDATE_CART_ITEM);
  const [removeItem] = useMutation(REMOVE_FROM_CART);

  if (!isOpen) return null;

  const cart = data?.cart;
  const items = cart?.items || [];

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateItem({ variables: { cartItemId, quantity: newQuantity } });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    try {
      await removeItem({ variables: { cartItemId } });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" 
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-background border-l border-border z-[101] shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif font-bold text-2xl uppercase tracking-widest text-brand-gold">Your Cart</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 text-muted-foreground hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!session ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <p className="text-muted-foreground uppercase tracking-widest text-sm">Please log in to view your cart.</p>
              <Link href="/login" onClick={() => setIsOpen(false)} className="border border-brand-gold text-brand-gold px-6 py-2 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold hover:text-black transition-colors">
                Log In
              </Link>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-gold" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <p className="text-muted-foreground uppercase tracking-widest text-sm">Your cart is empty.</p>
              <button onClick={() => setIsOpen(false)} className="border border-brand-gold text-brand-gold px-6 py-2 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold hover:text-black transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item: CartItemData) => {
                const product = item.product;
                const price = product.isOnSale && product.salePrice ? product.salePrice : product.basePrice;
                
                return (
                  <div key={item.id} className="flex gap-4 border-b border-border pb-6">
                    <div className="w-20 aspect-[3/4] bg-card border border-border shrink-0 relative">
                      {product.images?.[0] && (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold uppercase tracking-wider text-sm text-white">{product.name}</h3>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                              {item.variant.size || item.variant.color}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex items-center border border-border">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-brand-gold">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-brand-gold">
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-sm text-brand-gold">{formatNaira(price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {session && items.length > 0 && (
          <div className="p-6 border-t border-border bg-card">
            <div className="flex justify-between items-center mb-6">
              <span className="uppercase tracking-widest text-sm text-muted-foreground font-bold">Subtotal</span>
              <span className="text-2xl font-bold text-white">{formatNaira(cart?.subtotal ?? 0)}</span>
            </div>
            <Link 
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-bold uppercase tracking-[0.15em] px-8 py-4 flex items-center justify-center transition-colors text-sm gap-2"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
