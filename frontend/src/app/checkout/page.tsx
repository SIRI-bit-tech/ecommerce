"use client";

import { useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    basePrice: number;
    salePrice: number | null;
    isOnSale: boolean;
  };
}

interface CheckoutCart {
  id: string;
  subtotal: number;
  items: CartItem[];
}

interface ShippingRate {
  state: string;
  fee: number;
}

interface CheckoutData {
  cart: CheckoutCart | null;
  shippingRates: ShippingRate[];
}

const GET_CART_CHECKOUT = gql`
  query GetCartCheckout {
    cart {
      id
      subtotal
      items {
        id
        quantity
        product {
          name
          basePrice
          salePrice
          isOnSale
        }
      }
    }
    shippingRates {
      state
      fee
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        total
      }
      authorizationUrl
      reference
    }
  }
`;

interface CreateOrderData {
  createOrder: {
    order: { id: string; total: number };
    authorizationUrl: string;
    reference: string;
  };
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data, loading } = useQuery<CheckoutData>(GET_CART_CHECKOUT, {
    fetchPolicy: "network-only",
  });

  const [createOrder, { loading: creating }] = useMutation<CreateOrderData>(CREATE_ORDER);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    landmark: "",
    paymentMethod: "CARD",
  });

  useEffect(() => {
    if (session?.user?.name && !formData.fullName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, fullName: session.user.name || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
      </div>
    );
  }

  const cart = data?.cart;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h1 className="font-serif text-3xl uppercase tracking-widest mb-4">Checkout</h1>
        <p className="text-muted-foreground uppercase tracking-widest text-sm mb-8">Your cart is empty</p>
        <button onClick={() => router.push("/shop")} className="border border-brand-gold text-brand-gold px-8 py-3 uppercase tracking-widest text-sm font-bold hover:bg-brand-gold hover:text-black transition-colors">
          Return to Shop
        </button>
      </div>
    );
  }

  const selectedStateFee = data?.shippingRates?.find((r: { state: string; fee: number }) => r.state === formData.state)?.fee || 0;
  const total = cart.subtotal + selectedStateFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state) return alert("Please select a state.");

    try {
      const result = await createOrder({
        variables: {
          input: {
            paymentMethod: formData.paymentMethod,
            shippingAddress: {
              fullName: formData.fullName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              landmark: formData.landmark || undefined,
            },
            state: formData.state,
          },
        },
      });

      if (!result.data) throw new Error("No data returned from createOrder");
      const { authorizationUrl } = result.data.createOrder;

      if (authorizationUrl) {
        // Redirect to Flutterwave hosted payment page
        window.location.href = authorizationUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      alert(message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 flex flex-col lg:flex-row gap-12">
      <div className="flex-1">
        <h1 className="font-serif text-4xl uppercase tracking-widest mb-8 border-b border-border pb-4">Checkout</h1>
        
        <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Shipping Address */}
          <div className="bg-card p-8 border border-border">
            <h2 className="font-bold uppercase tracking-widest text-sm text-brand-gold mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Address</label>
                <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">City</label>
                <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">State</label>
                <select required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none">
                  <option value="">Select State</option>
                  {data?.shippingRates?.map((rate: { state: string; fee: number }) => (
                    <option key={rate.state} value={rate.state}>{rate.state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Phone</label>
                <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Landmark (Optional)</label>
                <input type="text" value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} className="w-full bg-background border border-border p-3 focus:border-brand-gold focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card p-8 border border-border">
            <h2 className="font-bold uppercase tracking-widest text-sm text-brand-gold mb-6">Payment Method</h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-4 cursor-pointer p-4 border border-border hover:border-brand-gold transition-colors">
                <input type="radio" name="payment" value="CARD" checked={formData.paymentMethod === "CARD"} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="accent-brand-gold" />
                <span className="font-bold uppercase tracking-widest text-sm">Card Payment</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer p-4 border border-border hover:border-brand-gold transition-colors">
                <input type="radio" name="payment" value="BANK_TRANSFER" checked={formData.paymentMethod === "BANK_TRANSFER"} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="accent-brand-gold" />
                <span className="font-bold uppercase tracking-widest text-sm">Bank Transfer</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Order Summary */}
      <div className="w-full lg:w-[400px]">
        <div className="bg-card p-8 border border-border sticky top-24">
          <h2 className="font-bold uppercase tracking-widest text-sm text-brand-gold mb-6">Order Summary</h2>
          
          <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-border">
            {cart.items.map((item: { id: string; quantity: number; product: { name: string; basePrice: number; salePrice: number | null; isOnSale: boolean } }) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div>
                  <span className="text-white font-bold">{item.quantity}x</span>{" "}
                  <span className="text-muted-foreground uppercase tracking-wider">{item.product.name}</span>
                </div>
                <span className="font-bold">{formatNaira((item.product.isOnSale ? (item.product.salePrice ?? item.product.basePrice) : item.product.basePrice) * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-border text-sm">
            <div className="flex justify-between text-muted-foreground uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-white font-bold">{formatNaira(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground uppercase tracking-widest">
              <span>Shipping {formData.state ? `(${formData.state})` : ""}</span>
              <span className="text-white font-bold">{formData.state ? formatNaira(selectedStateFee) : "---"}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-8">
            <span className="uppercase tracking-widest font-bold">Total</span>
            <span className="text-2xl font-bold text-brand-gold">{formatNaira(total)}</span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={creating}
            className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-bold uppercase tracking-[0.15em] px-8 py-4 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : "Place Order & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
