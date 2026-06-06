"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Loader2, Plus, Edit2, Trash2, Search, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  images: { url: string }[];
}

interface AdminProductsData {
  products: {
    products: AdminProduct[];
    pageInfo: {
      totalPages: number;
      currentPage: number;
    };
  } | null;
}

const GET_PRODUCTS = gql`
  query GetAdminProducts($filters: ProductFilterInput, $pagination: PaginationInput) {
    products(filters: $filters, pagination: $pagination) {
      products {
        id
        name
        category
        basePrice
        salePrice
        isOnSale
        images {
          url
        }
      }
      pageInfo {
        totalPages
        currentPage
      }
    }
  }
`;

const TOGGLE_SALE = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      isOnSale
    }
  }
`;

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery<AdminProductsData>(GET_PRODUCTS, {
    variables: { 
      filters: { search: searchTerm || undefined },
      pagination: { page, limit: 10 }
    },
    fetchPolicy: "cache-and-network"
  });

  const [updateProduct] = useMutation(TOGGLE_SALE);

  const handleToggleSale = async (id: string, currentlyOnSale: boolean) => {
    try {
      await updateProduct({
        variables: { id, input: { isOnSale: !currentlyOnSale } }
      });
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

  const products = data?.products?.products || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-4">
        <h1 className="font-serif text-3xl uppercase tracking-widest">Products</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-background border border-border py-2 pl-4 pr-10 focus:border-brand-gold focus:outline-none text-xs uppercase tracking-widest"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button className="bg-brand-gold text-black px-6 py-2 uppercase tracking-widest text-xs font-bold hover:bg-brand-gold-light transition-colors flex items-center gap-2">
            <Plus size={14} /> Add New
          </button>
        </div>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-4 font-bold">Product</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Base Price</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-xs">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p: AdminProduct) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background border border-border">
                        {p.images?.[0] && <Image src={p.images[0].url} alt="" fill className="object-cover" />}
                      </div>
                      <span className="font-bold uppercase tracking-wider text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 uppercase tracking-widest text-xs text-muted-foreground">{p.category}</td>
                  <td className="p-4 font-bold">{formatNaira(p.basePrice)}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleSale(p.id, p.isOnSale)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        p.isOnSale ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/50' : 'bg-background text-muted-foreground border-border hover:border-brand-gold'
                      }`}
                    >
                      {p.isOnSale ? <CheckCircle2 size={12} /> : <XCircle size={12} />} On Sale
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 text-muted-foreground">
                      <button className="p-2 hover:text-white transition-colors" title="Edit"><Edit2 size={16} /></button>
                      <button className="p-2 hover:text-destructive transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Basic Pagination Controls */}
      {(data?.products?.pageInfo?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors">Prev</button>
          <span className="flex items-center px-4 text-xs font-bold tracking-widest text-muted-foreground">{page} / {data?.products?.pageInfo?.totalPages ?? 0}</span>
          <button onClick={() => setPage(p => p + 1)} className="border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-brand-gold hover:text-brand-gold transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
