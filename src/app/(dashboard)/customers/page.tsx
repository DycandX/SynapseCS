"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  customers,
  getConversationsByCustomerId,
} from "@/lib/dummy-data";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pelanggan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Lihat dan kelola data pelanggan Anda.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
          aria-label="Cari pelanggan"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Tidak ada pelanggan</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Coba ubah kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const convos = getConversationsByCustomerId(customer.id);
            const openCount = convos.filter((c) => c.status === "open").length;

            return (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="block p-5 rounded-xl border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.995]"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {customer.name}
                    </h3>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Bergabung {formatDate(customer.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {convos.length} percakapan
                      </Badge>
                      {openCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 bg-info/10 text-info border-info/30"
                        >
                          {openCount} terbuka
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
