"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useUIStore } from "@/lib/store";
import { X } from "lucide-react";

const GET_ACTIVE_TICKER = gql`
  query GetActiveTicker {
    activeTicker {
      id
      message
    }
  }
`;

interface TickerActiveData {
  activeTicker: { id: string; message: string } | null;
}

export function PromoTicker() {
  const { isTickerDismissed, dismissTicker } = useUIStore();
  const { data, loading } = useQuery<TickerActiveData>(GET_ACTIVE_TICKER);

  if (loading || isTickerDismissed || !data?.activeTicker) {
    return null;
  }

  return (
    <div className="relative bg-brand-gold text-black px-4 py-2 flex items-center justify-center overflow-hidden h-10">
      <div className="animate-marquee whitespace-nowrap text-xs font-bold tracking-widest uppercase flex items-center">
        <span className="mx-4">{data.activeTicker.message}</span>
        {/* Duplicate for seamless scrolling */}
        <span className="mx-4" aria-hidden="true">{data.activeTicker.message}</span>
        <span className="mx-4" aria-hidden="true">{data.activeTicker.message}</span>
        <span className="mx-4" aria-hidden="true">{data.activeTicker.message}</span>
      </div>
      <button
        onClick={dismissTicker}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 transition-colors z-10"
        aria-label="Dismiss promo"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}
