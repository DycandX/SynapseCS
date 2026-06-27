import { createClient as createServerClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { supabase as clientSupabase } from "./supabase";

const openrouterKey = process.env.OPENROUTER_API_KEY || "your-openrouter-key-placeholder";

// Helper to obtain the correct Supabase client in the server context
async function getSupabaseClient() {
  try {
    const cookieStore = await cookies();
    return createServerClient(cookieStore);
  } catch (e) {
    // Falls back to static client-side anon instance if cookies() is called outside request context (e.g. build time)
    return clientSupabase;
  }
}

if (!process.env.OPENROUTER_API_KEY) {
  if (typeof window === "undefined") {
    console.warn("⚠️ Peringatan: Variabel lingkungan OPENROUTER_API_KEY belum disetel di .env.local.");
  }
}

/**
 * Helper to safely parse JSON from model responses, handling potential markdown formatting or conversational text.
 */
function parseJSONFromText(text: string) {
  try {
    // Strip markdown codeblock if present
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Try regex match for JSON objects/arrays
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {}
    }
    throw e;
  }
}

/**
 * Fallback representation of vector embeddings (returns zero-filled vector for DB insert compatibility).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // Returns a dummy 768-dimensional vector to satisfy DB foreign keys/types
  return new Array(768).fill(0);
}

/**
 * Mencari dokumen SOP yang paling relevan di Supabase.
 * Menggunakan pgvector jika embedding tersedia, atau fallback otomatis ke pencarian teks jika tidak ada key.
 */
export async function searchSOPs(query: string, matchCount = 2, threshold = 0.2) {
  try {
    const supabase = await getSupabaseClient();
    // Jika GEMINI_API_KEY tersedia, kita bisa mencoba pencarian berbasis cosine similarity (pgvector)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("Dummy") && !geminiKey.includes("placeholder")) {
      try {
        const queryEmbedding = await getEmbedding(query);
        const { data: documents, error } = await supabase.rpc("match_knowledge", {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: matchCount,
        });
        if (!error && documents) {
          return documents;
        }
      } catch (e) {
        console.error("Cosine search failed, falling back to text search:", e);
      }
    }

    // Fallback: Text search menggunakan ILIKE pada kolom title dan content
    console.log("RAG: Menggunakan text-based search fallback");
    const sanitizedQuery = query.replace(/[(),%]/g, " ");
    const { data: documents, error } = await supabase
      .from("knowledge_embeddings")
      .select("id, title, content")
      .or(`title.ilike.%${sanitizedQuery}%,content.ilike.%${sanitizedQuery}%`)
      .limit(matchCount);

    if (error) {
      console.error("Error calling text search fallback:", error.message);
      return [];
    }

    // Petakan dengan nilai kemiripan default agar kompatibel dengan pemanggil fungsi RAG
    return (documents || []).map((doc) => ({
      ...doc,
      similarity: 1.0,
    }));
  } catch (error) {
    console.error("SOP Search failed:", error);
    return [];
  }
}

/**
 * Menyusun draf balasan otomatis menggunakan OpenRouter (Gemini 2.0 Flash Free).
 */
export async function generateAIDraft(conversationId: string, customerMessage: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY || openrouterKey.includes("placeholder")) {
    await new Promise((r) => setTimeout(r, 1000));
    return `[SIMULATED DRAFT] Yth. Pelanggan,\n\nTerima kasih atas pesan Anda. Kami memohon maaf atas ketidaknyamanan yang dialami. (Aplikasi dalam mode simulasi karena OPENROUTER_API_KEY belum dikonfigurasi).`;
  }

  try {
    const supabase = await getSupabaseClient();
    // 1. Cari SOP yang relevan
    const sops = await searchSOPs(customerMessage, 2, 0.2);
    const sopContext = sops.length > 0
      ? sops.map((doc: any) => `SOP: ${doc.title}\nIsi SOP: ${doc.content}`).join("\n\n")
      : "Tidak ditemukan SOP spesifik yang cocok di basis pengetahuan.";

    // 2. Tarik riwayat pesan terakhir untuk konteks tambahan
    const { data: messages } = await supabase
      .from("messages")
      .select("sender_type, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const chatHistoryContext = messages && messages.length > 0
      ? messages.map((m) => `${m.sender_type === "agent" ? "Agen" : "Pelanggan"}: ${m.content}`).join("\n")
      : `Pelanggan: ${customerMessage}`;

    // 3. Panggil OpenRouter
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
4. Tulis draf secara langsung, tidak perlu menyertakan keterangan pembuka seperti "Berikut draf balasan:" atau tanda kutip di awal/akhir teks.

Tulis draf balasan Anda sekarang:
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SynapseCS",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorJSON = JSON.parse(errorText);
        errorMsg = errorJSON.error?.message || errorMsg;
      } catch {}
      throw new Error(`OpenRouter API error: ${errorMsg}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    }
    
    throw new Error(data.error?.message || "Gagal mendapatkan draf balasan dari OpenRouter.");
  } catch (error: any) {
    console.error("Error generating AI Draft via OpenRouter:", error);
    return "Maaf, sistem gagal menyusun draf balasan otomatis karena kendala teknis API OpenRouter.";
  }
}

/**
 * Menganalisis sentimen dari pesan masuk menggunakan OpenRouter (Gemini 2.0 Flash Free).
 */
export async function analyzeSentiment(messageContent: string): Promise<"marah" | "netral" | "puas"> {
  if (!process.env.OPENROUTER_API_KEY || openrouterKey.includes("placeholder")) {
    return "netral";
  }

  try {
    const prompt = `
Menganalisis sentimen/emosi dari pesan pelanggan customer service berikut.
Pilihan kategori sentimen hanya ada tiga:
1. "marah" -> jika pelanggan mengungkapkan kemarahan, kekecewaan mendalam, frustrasi, sarkasme negatif, komplain keras, atau ancaman pengembalian dana/tuntutan.
2. "puas" -> jika pelanggan mengekspresikan kepuasan, pujian, terima kasih yang antusias, atau emosi positif.
3. "netral" -> jika pelanggan sekadar bertanya secara normatif, menanyakan status barang tanpa emosi negatif, atau memberikan informasi netral.

Pesan pelanggan: "${messageContent}"

Kembalikan jawaban dalam format JSON terstruktur dengan skema berikut:
{
  "sentiment": "marah" | "netral" | "puas"
}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SynapseCS",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorJSON = JSON.parse(errorText);
        errorMsg = errorJSON.error?.message || errorMsg;
      } catch {}
      throw new Error(`OpenRouter Sentiment API error: ${errorMsg}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      const parsed = parseJSONFromText(content);
      if (parsed.sentiment && ["marah", "netral", "puas"].includes(parsed.sentiment)) {
        return parsed.sentiment;
      }
    }
    return "netral";
  } catch (error) {
    console.error("Error analyzing sentiment via OpenRouter:", error);
    return "netral";
  }
}

/**
 * Membuat ringkasan percakapan menjadi 3 poin utama menggunakan OpenRouter (Gemini 2.0 Flash Free).
 */
export async function generateConversationSummary(conversationId: string): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY || openrouterKey.includes("placeholder")) {
    await new Promise((r) => setTimeout(r, 1000));
    return [
      "[SIMULATED SUMMARY] Pelanggan menanyakan bantuan layanan.",
      "Sistem AI dalam mode simulasi/demo karena OPENROUTER_API_KEY kosong.",
      "Hubungkan kunci OpenRouter Anda untuk hasil ringkasan nyata.",
    ];
  }

  try {
    const supabase = await getSupabaseClient();
    // Ambil riwayat percakapan lengkap dari database
    const { data: messages } = await supabase
      .from("messages")
      .select("sender_type, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (!messages || messages.length === 0) {
      return ["Tidak ada riwayat pesan untuk dirangkum."];
    }

    const conversationHistoryText = messages
      .map((m) => `${m.sender_type === "agent" ? "Agen" : m.sender_type === "customer" ? "Pelanggan" : "Sistem AI"}: ${m.content}`)
      .join("\n");

    const prompt = `
Ringkas riwayat percakapan dukungan pelanggan berikut menjadi tepat 3 poin penting yang singkat dan padat.
Fokus pada:
1. Apa masalah utama pelanggan?
2. Tindakan apa yang sudah dilakukan agen/sistem?
3. Apa status akhir atau langkah tindak lanjut yang dibutuhkan?

Riwayat Percakapan:
---
${conversationHistoryText}
---

Kembalikan respon Anda dalam format JSON array berisi 3 string poin:
[
  "Poin 1...",
  "Poin 2...",
  "Poin 3..."
]
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SynapseCS",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorJSON = JSON.parse(errorText);
        errorMsg = errorJSON.error?.message || errorMsg;
      } catch {}
      throw new Error(`OpenRouter Summary API error: ${errorMsg}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      const parsed = parseJSONFromText(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return ["Gagal merangkum percakapan dalam struktur yang tepat."];
  } catch (error) {
    console.error("Error generating conversation summary via OpenRouter:", error);
    return ["Gagal memproses ringkasan obrolan via OpenRouter API."];
  }
}
