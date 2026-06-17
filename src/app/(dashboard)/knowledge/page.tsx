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
  ArrowRight,
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Basis Pengetahuan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dokumen SOP internal yang digunakan AI untuk membuat draf balasan.
          </p>
        </div>
        <Button className="gap-2 cursor-pointer shrink-0 shadow-sm" disabled>
          <Upload className="h-4 w-4" />
          Unggah SOP Baru
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari dokumen SOP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
          aria-label="Cari dokumen SOP"
        />
      </div>

      {filteredKB.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 rounded-2xl bg-muted mb-5">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Tidak ada dokumen</h3>
          <p className="text-muted-foreground text-sm mt-1">Coba ubah kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredKB.map((kb) => (
            <div
              key={kb.id}
              className="group p-5 rounded-xl border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm leading-tight">{kb.title}</h3>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Diperbarui {formatDate(kb.updatedAt)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                {kb.content}
              </p>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">SOP</Badge>

                <Dialog>
                  <DialogTrigger className="h-8 gap-1.5 text-xs cursor-pointer inline-flex items-center px-3 rounded-lg border hover:bg-muted font-medium transition-colors group">
                    <Eye className="h-3 w-3" />
                    Lihat
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{kb.title}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {kb.content}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-3 pt-3 border-t">
                      <Clock className="h-3 w-3" />
                      Terakhir diperbarui: {formatDate(kb.updatedAt)}
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
