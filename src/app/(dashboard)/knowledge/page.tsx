"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  BookOpen,
  Upload,
  Clock,
  FileText,
  Eye,
  Sparkles,
} from "lucide-react";
import { knowledgeBase } from "@/lib/dummy-data";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KnowledgePage() {
  const [search, setSearch] = useState("");

  const filteredKB = useMemo(() => {
    if (!search.trim()) return knowledgeBase;
    const q = search.toLowerCase();
    return knowledgeBase.filter(
      (kb) =>
        kb.title.toLowerCase().includes(q) ||
        kb.content.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Basis Pengetahuan SOP
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dokumen panduan operasional standar (SOP) internal yang dianalisis oleh AI untuk merancang balasan otomatis.
          </p>
        </div>
        <Button className="gap-2 cursor-pointer shrink-0 shadow-xs h-10 px-4 rounded-xl border border-border/80" variant="outline" disabled>
          <Upload className="h-4 w-4" />
          Unggah SOP Baru
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari dokumen SOP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30"
          aria-label="Cari dokumen SOP"
        />
      </div>

      {/* SOP Grid */}
      {filteredKB.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border/80 rounded-2xl p-8 shadow-xs">
          <div className="p-5 rounded-2xl bg-muted/50 mb-4 text-muted-foreground">
            <BookOpen className="h-9 w-9" />
          </div>
          <h3 className="text-base font-semibold">Tidak ada dokumen SOP</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Coba sesuaikan kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredKB.map((kb, idx) => (
            <div
              key={kb.id}
              className="group flex flex-col justify-between p-5 rounded-xl border border-border/85 bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-xs hover:-translate-y-0.5"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/15 shadow-xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                      {kb.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Diperbarui {formatDate(kb.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed mb-4">
                  {kb.content}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
                <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  SOP Tersemat
                </Badge>

                <Dialog>
                  <DialogTrigger className="h-8 gap-1.5 text-xs cursor-pointer inline-flex items-center px-3 rounded-md border border-border/80 bg-card hover:bg-accent font-semibold transition-colors">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    Detail SOP
                  </DialogTrigger>
                  <DialogContent className="max-w-lg rounded-2xl border border-border/80 bg-card shadow-lg">
                    <DialogHeader className="border-b border-border/60 pb-3 mb-4">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <FileText className="h-5 w-5" />
                        <DialogTitle className="text-base font-bold text-foreground">{kb.title}</DialogTitle>
                      </div>
                    </DialogHeader>
                    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border/40 max-h-96 overflow-y-auto font-sans">
                      {kb.content}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 mt-4 pt-3 border-t border-border/50">
                      <Clock className="h-3.5 w-3.5" />
                      <span>SOP terakhir diperbarui pada: {formatDate(kb.updatedAt)}</span>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
