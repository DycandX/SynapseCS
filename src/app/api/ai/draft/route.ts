import { searchSOPs, callOpenRouterCompletion } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { conversationId, customerMessage } = await req.json();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "anonymous";
  const { success } = await rateLimit.limit(userId);
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openrouterKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterKey || openrouterKey.includes("placeholder")) {
          controller.enqueue(encoder.encode(`data: {"error":"OpenRouter API Key belum dikonfigurasi."}\n\n`));
          controller.close();
          return;
        }

        // 1. Search SOPs + fetch messages (parallel)
        const [sops, { data: messages }] = await Promise.all([
          searchSOPs(customerMessage, 2, 0.2),
          supabase
            .from("messages")
            .select("sender_type, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(10),
        ]);
        
        const sopContext = sops.length > 0
          ? sops.map((doc: any) => `SOP: ${doc.title}\nIsi SOP: ${doc.content}`).join("\n\n")
          : "Tidak ditemukan SOP spesifik yang cocok di basis pengetahuan.";
        
        const chatHistoryContext = messages && messages.length > 0
          ? messages.map((m) => `${m.sender_type === "agent" ? "Agen" : "Pelanggan"}: ${m.content}`).join("\n")
          : `Pelanggan: ${customerMessage}`;
        
        // 2. Build prompt
        const prompt = `
Anda adalah sistem AI Customer Support cerdas bernama "SynapseCS" untuk membantu Agen CS manusia. 
Tugas Anda adalah merumuskan DRAF BALASAN yang sopan, solutif, empati, dan sesuai dengan Standar Operasional Prosedur (SOP) perusahaan.

Berikut adalah Dokumen SOP yang relevan untuk kasus ini:
---
${sopContext}
---

Berikut adalah riwayat percakapan terakhir:
---
${chatHistoryContext}
---

Pesanan pelanggan atau pesan terakhir yang butuh tanggapan: "${customerMessage}"

Aturan penulisan draf:
1. Jawab menggunakan bahasa Indonesia yang ramah, sopan, dan profesional.
2. Gunakan sapaan yang sesuai (Bapak/Ibu/Kak) berdasarkan konteks jika ada.
3. Fokus langsung pada solusi berdasarkan SOP yang disediakan. Jangan mengarang kebijakan yang tidak ada di SOP.
4. Tulis draf secara langsung, tidak perlu menyertakan keterangan pembuka.

Tulis draf balasan Anda sekarang:
        `.trim();
        
        // 3. Call OpenRouter with stream: true and fallback models
        const response = await callOpenRouterCompletion(
          [{ role: "user", content: prompt }],
          { stream: true }
        );
        
        // 4. Pipe stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          controller.enqueue(encoder.encode(`data: ${text}\n\n`));
        }
      } catch (err: any) {
        console.error("Stream route error:", err);
        controller.enqueue(encoder.encode(`data: {"error":"${err.message || String(err)}"}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: { 
      "Content-Type": "text/event-stream", 
      "Cache-Control": "no-cache", 
      "Connection": "keep-alive" 
    },
  });
}
