"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { Heart, Loader2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
}

const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: String!) {
    productBySlug(slug: $slug) {
      id
      name
      slug
      description
      category
      basePrice
      salePrice
      isOnSale
      images {
        url
        isPrimary
      }
      variants {
        id
        size
        color
        stock
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $variantId: ID, $quantity: Int!) {
    addToCart(productId: $productId, variantId: $variantId, quantity: $quantity) {
      id
      totalItems
    }
  }
`;

const ADD_TO_WISHLIST = gql`
  mutation AddToWishlist($productId: ID!) {
    addToWishlist(productId: $productId) {
      id
    }
  }
`;

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  basePrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductDetailData {
  productBySlug: ProductDetail | null;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: session } = useSession();
  const { setIsOpen: setCartOpen } = useCartStore();

  const { data, loading, error } = useQuery<ProductDetailData>(GET_PRODUCT_BY_SLUG, {
    variables: { slug },
  });

  const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART);
  const [addToWishlist, { loading: addingToWishlist }] = useMutation(ADD_TO_WISHLIST);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const product = data?.productBySlug;
  const selectedVariant = product?.variants?.find((v: ProductVariant) => v.id === selectedVariantId);
  
  // Need to select variant if they exist
  const needsVariantSelection = (product?.variants?.length ?? 0) > 0 && !selectedVariantId;
  const isOutOfStock = (product?.variants?.length ?? 0) > 0 
    ? (selectedVariant ? selectedVariant.stock < 1 : false) 
    : false; // Assume in stock if no variants for now (or backend should handle)

  const handleAddToCart = async () => {
    if (!product) return;
    if (!session) {
      alert("Please login to add items to cart.");
      // In a real app, redirect to login or open auth modal
      return;
    }
    
    if (needsVariantSelection) {
      alert("Please select a size/color.");
      return;
    }

    try {
      await addToCart({
        variables: {
          productId: product.id,
          variantId: selectedVariantId,
          quantity,
        },
      });
      setCartOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add to cart";
      alert(message);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    if (!session) {
      alert("Please login to use the wishlist.");
      return;
    }
    try {
      await addToWishlist({
        variables: { productId: product.id },
      });
      alert("Added to wishlist");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add to wishlist";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-serif uppercase tracking-widest text-destructive">Product Not Found</h1>
        <Link href="/shop" className="border border-brand-gold text-brand-gold px-6 py-3 uppercase tracking-widest font-bold text-sm hover:bg-brand-gold hover:text-black transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[3/4] bg-card border border-border relative overflow-hidden w-full">
            {product.isOnSale && (
              <div className="absolute top-6 left-6 bg-brand-gold text-black text-xs font-bold uppercase tracking-widest px-4 py-2 z-10">
                Sale
              </div>
            )}
            {product.images?.[activeImageIndex] ? (
              <Image 
                src={product.images[activeImageIndex].url} 
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground uppercase tracking-widest text-sm">
                No Image
              </div>
            )}
          </div>
          
          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img: ProductImage, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-24 aspect-[3/4] border ${activeImageIndex === idx ? 'border-brand-gold opacity-100' : 'border-border opacity-50 hover:opacity-100'} transition-all`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <h2 className="text-brand-gold uppercase tracking-widest text-xs font-bold mb-4">
              {product.category.replace("_", " ")}
            </h2>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold uppercase tracking-wider leading-[1.1] mb-6">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 text-2xl">
              {product.isOnSale && product.salePrice ? (
                <>
                  <span className="text-white font-bold">{formatNaira(product.salePrice)}</span>
                  <span className="text-muted-foreground line-through text-lg">{formatNaira(product.basePrice)}</span>
                </>
              ) : (
                <span className="text-white font-bold">{formatNaira(product.basePrice)}</span>
              )}
            </div>
          </div>

          <div className="prose prose-invert prose-p:text-muted-foreground prose-p:font-light prose-p:leading-relaxed mb-10 max-w-none border-b border-border pb-10">
            <p>{product.description}</p>
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mb-10">
              <h3 className="uppercase tracking-widest text-sm font-bold text-white mb-4">Select Option</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v: ProductVariant) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariantId(v.id); setQuantity(1); }}
                    disabled={v.stock < 1}
                    className={`
                      px-6 py-3 border uppercase tracking-widest text-xs font-bold transition-colors
                      ${selectedVariantId === v.id ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-border text-white hover:border-brand-gold'}
                      ${v.stock < 1 ? 'opacity-30 cursor-not-allowed line-through' : ''}
                    `}
                  >
                    {v.size || v.color || "Standard"}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p className="mt-4 text-xs tracking-widest text-muted-foreground uppercase">
                  {selectedVariant.stock} left in stock
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex gap-4">
              <div className="flex items-center border border-border">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(selectedVariant ? Math.min(selectedVariant.stock, quantity + 1) : quantity + 1)}
                  className="px-4 py-3 text-muted-foreground hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                className="flex-1 bg-brand-gold hover:bg-brand-gold-light text-black font-bold uppercase tracking-[0.15em] px-8 py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingToCart ? <Loader2 className="animate-spin" size={20} /> : isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              
              <button 
                onClick={handleAddToWishlist}
                disabled={addingToWishlist}
                className="border border-border hover:border-brand-gold hover:text-brand-gold px-6 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {addingToWishlist ? <Loader2 className="animate-spin" size={20} /> : <Heart size={20} />}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground uppercase tracking-widest leading-loose flex flex-col gap-2">
            <p>Free shipping on orders over ₦100,000.</p>
            <p>Delivery typically within 3-5 business days.</p>
          </div>
        </div>
      </div>
      
      {/* ─── AI Stylist CTA ────────────────────────────────────────────────────── */}
      <div className="mt-32 pt-24 border-t border-border flex flex-col items-center text-center">
        <h2 className="text-3xl font-serif font-bold uppercase tracking-wider mb-6">Need styling advice?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Our AI Style Assistant can help you pair this {product.name.toLowerCase()} with the perfect accessories and complementary pieces from our collection.
        </p>
        <Link 
          href={`/style-assistant?product=${product.id}`}
          className="border border-brand-gold text-brand-gold px-8 py-4 uppercase tracking-[0.15em] font-bold text-sm hover:bg-brand-gold hover:text-black transition-colors flex items-center gap-2"
        >
          Consult the Assistant <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
