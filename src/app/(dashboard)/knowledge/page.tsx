"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { getSOPsAction, addSOPAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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
import { knowledgeBase as dummyKB } from "@/lib/dummy-data";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KnowledgePage() {
  const { isUsingSupabase } = useAuth();
  
  // States
  const [kbList, setKbList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Add SOP Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Load SOPs
  const loadSOPs = async () => {
    setLoading(true);
    if (isUsingSupabase) {
      const data = await getSOPsAction();
      setKbList(data || []);
    } else {
      setKbList(dummyKB);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSOPs();
  }, [isUsingSupabase]);

  // Form submit handler
  const handleAddSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsAdding(true);
    const success = await addSOPAction(newTitle, newContent);
    if (success) {
      setNewTitle("");
      setNewContent("");
      setIsAddOpen(false);
      await loadSOPs(); // Refresh SOP list
    } else {
      alert("Gagal menyimpan SOP. Pastikan variabel GEMINI_API_KEY telah dikonfigurasi.");
    }
    setIsAdding(false);
  };

  // Search Filter
  const filteredKB = useMemo(() => {
    if (!search.trim()) return kbList;
    const q = search.toLowerCase();
    return kbList.filter(
      (kb) =>
        kb.title.toLowerCase().includes(q) ||
        kb.content.toLowerCase().includes(q)
    );
  }, [kbList, search]);

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

        {/* Add SOP Button with Dialog */}
        {!isUsingSupabase ? (
          <Button
            className="gap-2 cursor-not-allowed shrink-0 shadow-xs h-10 px-4 rounded-xl border border-border/80 text-muted-foreground"
            variant="outline"
            disabled
            title="Aktifkan Supabase untuk mengunggah SOP baru"
          >
            <Upload className="h-4 w-4" />
            Unggah SOP Baru
          </Button>
        ) : (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger 
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2 cursor-pointer shrink-0 shadow-xs h-10 px-4 rounded-xl border border-border/80 text-foreground"
              )}
            >
              <Upload className="h-4 w-4" />
              Unggah SOP Baru
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border border-border/85 bg-card shadow-lg">
            <DialogHeader className="border-b border-border/60 pb-3 mb-4">
              <DialogTitle className="text-base font-bold text-foreground">Unggah Dokumen SOP Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSOP} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sop-title" className="text-xs font-semibold text-muted-foreground">Judul SOP</label>
                <Input
                  id="sop-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: SOP Pengembalian Barang Cacat"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sop-content" className="text-xs font-semibold text-muted-foreground">Isi SOP / Konten Panduan</label>
                <textarea
                  id="sop-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Masukkan panduan operasional lengkap di sini. Teks ini akan diubah oleh Gemini menjadi vektor embedding..."
                  className="w-full min-h-[150px] max-h-[300px] border border-border/80 bg-background rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-foreground"
                  required
                />
              </div>
              <Button type="submit" disabled={isAdding} className="w-full rounded-xl gap-2 cursor-pointer h-10.5">
                {isAdding ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Menghasilkan Vektor AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Simpan & Daftarkan SOP
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
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
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filteredKB.length === 0 ? (
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
                    <h3 className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors truncate">
                      {kb.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Diperbarui {formatDate(kb.updated_at || kb.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed mb-4 font-medium">
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
                      <span>SOP terakhir diperbarui pada: {formatDate(kb.updated_at || kb.updatedAt)}</span>
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
