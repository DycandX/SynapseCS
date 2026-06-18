"use server";

import { supabase } from "@/lib/supabase";
import {
  generateAIDraft,
  generateConversationSummary,
  analyzeSentiment,
  getEmbedding,
} from "@/lib/ai";
import { sendUrgentAlertEmail } from "@/lib/resend";

/**
 * Server Action: Menghasilkan draf balasan AI dengan konteks RAG SOP.
 */
export async function getAIDraftAction(
  conversationId: string,
  lastMessage: string
): Promise<string> {
  try {
    return await generateAIDraft(conversationId, lastMessage);
  } catch (error) {
    console.error("Action error generating draft:", error);
    return "Maaf, gagal menyusun draf balasan otomatis karena kendala teknis backend.";
  }
}

/**
 * Server Action: Menghasilkan ringkasan obrolan (3 poin) dan menyimpannya di basis data.
 */
export async function getAISummaryAction(
  conversationId: string
): Promise<string[]> {
  try {
    const summaryPoints = await generateConversationSummary(conversationId);
    const summaryText = summaryPoints.join(" \n");

    // Simpan ringkasan ke tabel conversations di Supabase
    await supabase
      .from("conversations")
      .update({ ai_summary: summaryText, updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return summaryPoints;
  } catch (error) {
    console.error("Action error summarizing conversation:", error);
    return ["Gagal memproses ringkasan obrolan."];
  }
}

/**
 * Server Action: Mengirim/memasukkan pesan baru ke database.
 * Jika pengirim adalah pelanggan, otomatis menganalisis sentimen, eskalasi, dan mengirim email Resend jika marah.
 */
export async function sendMessageAction(
  conversationId: string,
  content: string,
  senderType: "customer" | "agent" | "ai_system",
  attachmentUrl?: string
) {
  try {
    // 1. Masukkan pesan ke tabel messages
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        content,
        attachment_url: attachmentUrl || null,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // 2. Perbarui waktu pembaruan percakapan
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    // 3. Jika pesan dikirim oleh pelanggan, jalankan analisis sentimen AI
    if (senderType === "customer") {
      const sentiment = await analyzeSentiment(content);

      // Perbarui kolom sentimen di tabel conversations
      await supabase
        .from("conversations")
        .update({ sentiment })
        .eq("id", conversationId);

      // Jika terdeteksi sentimen MARAH, picu notifikasi email dan log sistem
      if (sentiment === "marah") {
        // Ambil nama pelanggan
        const { data: convo } = await supabase
          .from("conversations")
          .select("customer_id, customers(name)")
          .eq("id", conversationId)
          .single();

        const customerName = (convo as any)?.customers?.name || "Pelanggan";

        // Kirim email darurat via Resend
        await sendUrgentAlertEmail(customerName, content, conversationId);

        // Sisipkan pesan log sistem AI secara otomatis
        const systemLogContent = `📊 Analisis Sentimen: MARAH — Pelanggan mengekspresikan kekecewaan tinggi terkait keluhannya. Notifikasi eskalasi darurat telah dikirim ke administrator.`;
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_type: "ai_system",
          content: systemLogContent,
        });
      }
    }

    return { success: true, message };
  } catch (error: any) {
    console.error("Action error sending message:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Mengambil seluruh dokumen SOP dari database.
 */
export async function getSOPsAction() {
  try {
    const { data, error } = await supabase
      .from("knowledge_embeddings")
      .select("id, title, content, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Action error fetching SOPs:", error);
    return [];
  }
}

/**
 * Server Action: Menambahkan dokumen SOP baru, menghitung vektor embeddings gratis via Gemini,
 * dan menyimpannya di pgvector Supabase.
 */
export async function addSOPAction(
  title: string,
  content: string
): Promise<boolean> {
  try {
    // 1. Hasilkan embedding 768 dimensi via Gemini text-embedding-004
    const embedding = await getEmbedding(content);

    // 2. Simpan ke database Supabase
    const { error } = await supabase.from("knowledge_embeddings").insert({
      title,
      content,
      embedding,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Action error adding SOP with vector embedding:", error);
    return false;
  }
}

/**
 * Server Action: Mengambil data statistik dashboard riil dari Supabase.
 */
export async function getDashboardStatsAction() {
  try {
    // Tarik data mentah dari database
    const { data: convos } = await supabase.from("conversations").select("id, status, sentiment");
    const { count: totalCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true });
    
    const conversationsList = convos || [];
    const total = conversationsList.length;
    const open = conversationsList.filter((c) => c.status === "open").length;
    const pending = conversationsList.filter((c) => c.status === "pending").length;
    const closed = conversationsList.filter((c) => c.status === "closed").length;

    // CSAT
    const closedConvos = conversationsList.filter((c) => c.status === "closed");
    const satisfied = closedConvos.filter((c) => c.sentiment === "puas").length;
    const csatPercent = closedConvos.length > 0 ? Math.round((satisfied / closedConvos.length) * 100) : 90;

    // Sentimen
    const marah = conversationsList.filter((c) => c.sentiment === "marah").length;
    const netral = conversationsList.filter((c) => c.sentiment === "netral").length;
    const puas = conversationsList.filter((c) => c.sentiment === "puas").length;

    return {
      total,
      open,
      pending,
      closed,
      totalCustomers: totalCustomers || 0,
      csatPercent,
      sentimentBreakdown: { marah, netral, puas },
    };
  } catch (error) {
    console.error("Action error fetching dashboard stats:", error);
    return null;
  }
}
