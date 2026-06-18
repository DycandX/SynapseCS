import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDummyGeminiAPIKeyForBuildsOnly";
const genAI = new GoogleGenerativeAI(apiKey);

if (!process.env.GEMINI_API_KEY) {
  if (typeof window === "undefined") {
    console.warn("⚠️ Peringatan: Variabel lingkungan GEMINI_API_KEY belum disetel di .env.local.");
  }
}

/**
 * Menghasilkan representasi vektor (embedding) dari teks menggunakan model text-embedding-004 (768 dimensi).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!apiKey) {
    // Return dummy 768-dimensional vector if API Key is not configured
    return new Array(768).fill(0).map((_, i) => (i === 0 ? 1 : 0));
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Mencari dokumen SOP yang paling relevan di Supabase menggunakan pgvector cosine similarity.
 */
export async function searchSOPs(query: string, matchCount = 2, threshold = 0.3) {
  try {
    const queryEmbedding = await getEmbedding(query);
    
    // Panggil RPC match_knowledge di Supabase
    const { data: documents, error } = await supabase.rpc("match_knowledge", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: matchCount,
    });
    
    if (error) {
      console.error("Error calling match_knowledge RPC:", error.message);
      return [];
    }
    
    return documents || [];
  } catch (error) {
    console.error("SOP Search RAG failed:", error);
    return [];
  }
}

/**
 * Menyusun draf balasan otomatis menggunakan Gemini 1.5 Flash dengan konteks RAG SOP.
 */
export async function generateAIDraft(conversationId: string, customerMessage: string): Promise<string> {
  if (!apiKey) {
    // Fallback jika API key tidak disetel (mengembalikan simulasi lokal)
    await new Promise((r) => setTimeout(r, 1000));
    return `[SIMULATED DRAFT] Yth. Pelanggan,\n\nTerima kasih atas pesan Anda. Kami mohon maaf atas ketidaknyamanan yang dialami. Saat ini sistem AI kami sedang dalam mode demo (GEMINI_API_KEY belum dikonfigurasi).\n\nSilakan konfigurasikan variabel lingkungan untuk mengaktifkan AI asli.\n\nHormat kami,\nTim CS`;
  }

  try {
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

    // 3. Panggil Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating AI Draft:", error);
    return "Maaf, sistem gagal menyusun draf balasan otomatis karena kendala teknis API.";
  }
}

/**
 * Menganalisis sentimen dari pesan masuk menggunakan Gemini 1.5 Flash (Output JSON terstruktur).
 */
export async function analyzeSentiment(messageContent: string): Promise<"marah" | "netral" | "puas"> {
  if (!apiKey) return "netral";

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    if (data.sentiment && ["marah", "netral", "puas"].includes(data.sentiment)) {
      return data.sentiment;
    }
    return "netral";
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "netral";
  }
}

/**
 * Membuat ringkasan percakapan menjadi 3 poin utama menggunakan Gemini 1.5 Flash.
 */
export async function generateConversationSummary(conversationId: string): Promise<string[]> {
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 1000));
    return [
      "[SIMULATED SUMMARY] Pelanggan menanyakan bantuan layanan.",
      "Sistem AI dalam mode simulasi/demo karena GEMINI_API_KEY kosong.",
      "Hubungkan kunci Google AI Studio untuk hasil ringkasan nyata.",
    ];
  }

  try {
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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

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

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());
    
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return ["Gagal merangkum percakapan dalam struktur yang tepat."];
  } catch (error) {
    console.error("Error generating conversation summary:", error);
    return ["Gagal memproses ringkasan obrolan via Gemini API."];
  }
}
