"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface OrderItemSnapshot {
  name: string;
  image?: string;
  size?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  snapshot: OrderItemSnapshot;
}

interface Order {
  id: string;
  status: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

const GET_MY_ORDERS = gql`
  query GetMyOrders($pagination: PaginationInput) {
    orders(pagination: $pagination) {
      orders {
        id
        status
        total
        paymentStatus
        createdAt
        items {
          id
          quantity
          snapshot
        }
      }
    }
  }
`;

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const { data, loading, error } = useQuery<any>(GET_MY_ORDERS, {
    variables: { pagination: { page: 1, limit: 20 } },
    fetchPolicy: "cache-and-network"
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive uppercase tracking-widest font-bold">Failed to load orders.</div>;
  }

  const orders = data?.orders?.orders || [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl uppercase tracking-widest border-b border-border pb-4">Order History</h1>
      
      {orders.length === 0 ? (
        <div className="bg-card border border-border p-12 flex flex-col items-center justify-center text-center gap-4">
          <Package size={48} className="text-muted-foreground mb-2" />
          <p className="text-muted-foreground uppercase tracking-widest text-sm">You have not placed any orders yet.</p>
          <Link href="/shop" className="mt-4 border border-brand-gold text-brand-gold px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold hover:text-black transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-card border border-border p-6 flex flex-col md:flex-row gap-6">
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Order Number</span>
                    <span className="font-bold font-mono text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Date</span>
                    <span className="font-bold text-white uppercase tracking-widest text-xs">{format(new Date(order.createdAt), "MMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Total</span>
                    <span className="font-bold text-brand-gold">{formatNaira(order.total)}</span>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      order.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                      order.paymentStatus === 'FAILED' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 
                      'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    }`}>
                      {order.paymentStatus}
                    </span>
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {order.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center gap-4 text-sm">
                      <div className="w-12 h-16 bg-muted shrink-0 border border-border relative">
                        {item.snapshot?.image && (
                          <Image src={item.snapshot.image} alt={item.snapshot.name} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-white">{item.snapshot.name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">
                          Qty: {item.quantity} {item.snapshot.size ? `| Size: ${item.snapshot.size}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
