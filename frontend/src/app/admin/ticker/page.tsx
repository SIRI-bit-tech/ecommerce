"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Loader2, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Ticker {
  id: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

interface TickerData {
  allTickers: Ticker[] | null;
}

const GET_TICKERS = gql`
  query GetAllTickers {
    allTickers {
      id
      message
      isActive
      createdAt
    }
  }
`;

const CREATE_TICKER = gql`
  mutation CreatePromoTicker($message: String!) {
    createPromoTicker(message: $message) {
      id
    }
  }
`;

const SET_ACTIVE_TICKER = gql`
  mutation SetPromoTicker($id: ID!) {
    setPromoTicker(id: $id) {
      id
      isActive
    }
  }
`;

const DELETE_TICKER = gql`
  mutation DeletePromoTicker($id: ID!) {
    deletePromoTicker(id: $id)
  }
`;

export default function AdminTickerPage() {
  const [message, setMessage] = useState("");
  
  const { data, loading, refetch } = useQuery<TickerData>(GET_TICKERS, {
    fetchPolicy: "cache-and-network"
  });

  const [createTicker, { loading: creating }] = useMutation(CREATE_TICKER);
  const [setActiveTicker] = useMutation(SET_ACTIVE_TICKER);
  const [deleteTicker] = useMutation(DELETE_TICKER);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await createTicker({ variables: { message } });
      setMessage("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActiveTicker({ variables: { id } });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticker?")) return;
    try {
      await deleteTicker({ variables: { id } });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  const tickers = data?.allTickers || [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl uppercase tracking-widest border-b border-border pb-4">Promo Ticker</h1>
      
      <div className="bg-card border border-border p-6">
        <h2 className="font-bold uppercase tracking-widest text-brand-gold text-sm mb-6">Create New Ticker</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g. FREE SHIPPING ON ALL ORDERS OVER ₦100,000" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-background border border-border py-3 px-4 focus:border-brand-gold focus:outline-none uppercase tracking-widest text-xs"
            required
          />
          <button 
            type="submit" 
            disabled={creating || !message.trim()}
            className="bg-brand-gold text-black px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Add Ticker
          </button>
        </form>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-4 font-bold">Message</th>
              <th className="p-4 font-bold">Date Created</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-xs">
                  No tickers found.
                </td>
              </tr>
            ) : (
              tickers.map((t: Ticker) => (
                <tr key={t.id} className={`border-b border-border hover:bg-muted/5 transition-colors ${t.isActive ? 'bg-brand-gold/5' : ''}`}>
                  <td className="p-4 font-bold uppercase tracking-wider text-white">
                    {t.message}
                  </td>
                  <td className="p-4 text-muted-foreground uppercase tracking-widest text-xs">
                    {format(new Date(t.createdAt), "MMM dd, yyyy")}
                  </td>
                  <td className="p-4">
                    {t.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!t.isActive && (
                        <button 
                          onClick={() => handleSetActive(t.id)}
                          className="border border-brand-gold text-brand-gold px-3 py-1 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold hover:text-black transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
