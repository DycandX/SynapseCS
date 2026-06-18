"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  customers as dummyCustomers,
  getConversationsByCustomerId,
} from "@/lib/dummy-data";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const { isUsingSupabase } = useAuth();
  
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 1. Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      if (isUsingSupabase) {
        try {
          const { data, error } = await supabase
            .from("customers")
            .select(`
              *,
              conversations(id, status)
            `)
            .order("name", { ascending: true });

          if (error) throw error;
          
          const mapped = (data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            created_at: c.created_at,
            totalConversations: c.conversations?.length || 0,
            openConversations: c.conversations?.filter((cv: any) => cv.status === "open").length || 0,
          }));
          setCustomersList(mapped);
        } catch (error) {
          console.error("Failed to load customers from Supabase:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Dummy mapping
        const mapped = dummyCustomers.map((c) => {
          const convos = getConversationsByCustomerId(c.id);
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            created_at: c.createdAt,
            totalConversations: convos.length,
            openConversations: convos.filter((cv) => cv.status === "open").length,
          };
        });
        setCustomersList(mapped);
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isUsingSupabase]);

  // 2. Filter list
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customersList;
    const q = search.toLowerCase();
    return customersList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customersList, search]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Basis Data Pelanggan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lihat daftar profil pelanggan, detail kontak, serta riwayat obrolan pendukung.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card border border-border/80 px-3.5 py-2 rounded-xl shadow-xs self-start sm:self-center">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>{customersList.length} total pelanggan</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30"
          aria-label="Cari pelanggan"
        />
      </div>

      {/* Customers Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border/80 rounded-2xl p-8 shadow-xs">
          <div className="p-5 rounded-2xl bg-muted/50 mb-4 text-muted-foreground">
            <Users className="h-9 w-9" />
          </div>
          <h3 className="text-base font-semibold">Tidak ada pelanggan</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Coba ubah kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers.map((customer, idx) => {
            return (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="group block p-5 rounded-xl border border-border/85 bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-xs hover:-translate-y-0.5"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0 ring-1 ring-border/80 shadow-xs">
                    {customer.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground/95 truncate group-hover:text-primary transition-colors">
                        {customer.name}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>

                    {/* Customer Meta Info */}
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span>Bergabung {formatDate(customer.created_at)}</span>
                      </div>
                    </div>

                    {/* Badge Stats */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-semibold gap-1 px-2.5 py-0.5 rounded-md border border-border/40">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.totalConversations} percakapan
                      </Badge>
                      {customer.openConversations > 0 && (
                        <Badge variant="outline" className="text-[10px] font-semibold gap-1 bg-info/10 text-info border-info/20 px-2.5 py-0.5 rounded-md animate-pulse-soft">
                          {customer.openConversations} terbuka
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
