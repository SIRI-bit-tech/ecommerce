"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Loader2, DollarSign, ShoppingBag, Users, Package } from "lucide-react";

const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminStats {
      totalOrders
      totalRevenue
      totalProducts
      newCustomers
      ordersByStatus {
        status
        count
      }
    }
  }
`;

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  newCustomers: number;
  ordersByStatus: { status: string; count: number }[];
}

interface AdminStatsData {
  adminStats: AdminStats | null;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useQuery<AdminStatsData>(GET_ADMIN_STATS, {
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
    return <div className="text-destructive uppercase tracking-widest font-bold">Failed to load stats. Check admin permissions.</div>;
  }

  const stats = data?.adminStats;

  if (!stats) {
    return <div className="text-muted-foreground uppercase tracking-widest text-xs">No stats available.</div>;
  }

  const statCards = [
    { label: "Total Revenue", value: formatNaira(stats.totalRevenue), icon: DollarSign },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag },
    { label: "Total Products", value: stats.totalProducts, icon: Package },
    { label: "New Customers", value: stats.newCustomers, icon: Users },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl uppercase tracking-widest border-b border-border pb-4">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-full">
                  <Icon size={16} />
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border p-8">
        <h2 className="font-bold uppercase tracking-widest text-brand-gold text-sm mb-6">Orders by Status</h2>
        {stats.ordersByStatus?.length === 0 ? (
          <p className="text-muted-foreground uppercase tracking-widest text-xs">No orders found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {stats.ordersByStatus.map((s: { status: string; count: number }) => (
              <div key={s.status} className="border border-border p-4 flex flex-col items-center justify-center text-center gap-2">
                <span className="text-2xl font-bold text-white">{s.count}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
