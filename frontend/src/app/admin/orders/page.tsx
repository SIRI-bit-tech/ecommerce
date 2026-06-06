"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

interface AdminOrder {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface AdminOrdersData {
  adminOrders: {
    orders: AdminOrder[];
    pageInfo: {
      totalPages: number;
      currentPage: number;
    };
  } | null;
}

const GET_ADMIN_ORDERS = gql`
  query GetAdminOrders($filters: OrderFilterInput, $pagination: PaginationInput) {
    adminOrders(filters: $filters, pagination: $pagination) {
      orders {
        id
        status
        paymentStatus
        total
        createdAt
        user {
          fullName
          email
        }
      }
      pageInfo {
        totalPages
        currentPage
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery<AdminOrdersData>(GET_ADMIN_ORDERS, {
    variables: { 
      filters: { search: searchTerm || undefined },
      pagination: { page, limit: 10 }
    },
    fetchPolicy: "cache-and-network"
  });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ variables: { orderId, status: newStatus } });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  const orders = data?.adminOrders?.orders || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-4">
        <h1 className="font-serif text-3xl uppercase tracking-widest">Orders</h1>
        <div className="relative flex-1 md:w-64 md:flex-none">
          <input 
            type="text" 
            placeholder="Search orders (ID, User)..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-background border border-border py-2 pl-4 pr-10 focus:border-brand-gold focus:outline-none text-xs uppercase tracking-widest"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-4 font-bold">Order ID</th>
              <th className="p-4 font-bold">Customer</th>
              <th className="p-4 font-bold">Date</th>
              <th className="p-4 font-bold">Total</th>
              <th className="p-4 font-bold">Payment</th>
              <th className="p-4 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-xs">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o: AdminOrder) => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                  <td className="p-4 font-mono font-bold">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-4">
                    <span className="block font-bold text-white uppercase tracking-wider">{o.user.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{o.user.email}</span>
                  </td>
                  <td className="p-4 text-muted-foreground uppercase tracking-widest text-xs">{format(new Date(o.createdAt), "MMM dd, yyyy")}</td>
                  <td className="p-4 font-bold text-brand-gold">{formatNaira(o.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                      o.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      o.paymentStatus === 'FAILED' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                      'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select 
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="bg-background border border-border px-2 py-1 text-xs uppercase tracking-widest font-bold focus:border-brand-gold focus:outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {(data?.adminOrders?.pageInfo?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors">Prev</button>
          <span className="flex items-center px-4 text-xs font-bold tracking-widest text-muted-foreground">{page} / {data?.adminOrders?.pageInfo?.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
