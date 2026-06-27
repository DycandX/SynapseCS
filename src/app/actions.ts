"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import {
  generateConversationSummary,
  analyzeSentiment,
  getEmbedding,
} from "@/lib/ai";
import { sendUrgentAlertEmail } from "@/lib/resend";

/**
 * Server Action: Mencatat log aktivitas audit ke database (Standar Industri).
 */
export async function logActivityAction(
  action: string,
  description: string,
  metadata?: any
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Ambil user ID dari sesi yang sedang aktif
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      description,
      metadata: metadata || null,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Action error logging activity:", error);
    return false;
  }
}

/**
 * Server Action: Mengambil daftar log aktivitas audit (Admin only / Agent).
 */
export async function getActivityLogsAction() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        id,
        action,
        description,
        metadata,
        created_at,
        profiles (name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Action error fetching activity logs:", error);
    return [];
  }
}

/**
 * Server Action: Mengambil seluruh tim agen dan admin dari Supabase.
 */
export async function getProfilesAction() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, updated_at")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Action error fetching profiles:", error);
    return [];
  }
}

/**
 * Server Action: Menugaskan (klaim) tiket ke agen tertentu.
 */
export async function claimConversationAction(
  conversationId: string,
  agentId: string
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Perbarui agent_id di database
    const { error } = await supabase
      .from("conversations")
      .update({
        agent_id: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) throw error;

    // Catat log aktivitas klaim tiket
    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", agentId)
      .single();

    const agentName = agentProfile?.name || "Agen";
    await logActivityAction(
      "CLAIM_TICKET",
      `${agentName} telah mengklaim tiket obrolan #${conversationId}`,
      { conversationId, agentId }
    );

    return true;
  } catch (error) {
    console.error("Action error claiming conversation:", error);
    return false;
  }
}

/**
 * Server Action: Memperbarui status tiket percakapan (open, pending, closed).
 */
export async function updateConversationStatusAction(
  conversationId: string,
  status: "open" | "pending" | "closed"
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Ambil status lama terlebih dahulu untuk pencatatan log
    const { data: oldConvo } = await supabase
      .from("conversations")
      .select("status")
      .eq("id", conversationId)
      .single();

    const oldStatus = oldConvo?.status || "unknown";

    // 2. Perbarui status di database
    const { error } = await supabase
      .from("conversations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) throw error;

    // 3. Ambil nama agen aktif yang mengubah status
    const { data: { session } } = await supabase.auth.getSession();
    const agentId = session?.user?.id;
    let agentName = "Sistem";

    if (agentId) {
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", agentId)
        .single();
      if (agentProfile?.name) {
        agentName = agentProfile.name;
      }
    }

    // Terjemahan label status
    const statusLabels: Record<string, string> = {
      open: "Terbuka",
      pending: "Tertunda",
      closed: "Selesai",
      unknown: "Tidak Diketahui",
    };

    // 4. Catat aktivitas perubahan status ke log audit
    await logActivityAction(
      "UPDATE_STATUS",
      `${agentName} mengubah status tiket #${conversationId} dari "${statusLabels[oldStatus]}" menjadi "${statusLabels[status]}"`,
      { conversationId, oldStatus, newStatus: status, agentId }
    );

    return true;
  } catch (error) {
    console.error("Action error updating conversation status:", error);
    return false;
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

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Simpan ringkasan ke tabel conversations di Supabase
    await supabase
      .from("conversations")
      .update({ ai_summary: summaryText, updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Catat log audit aktivitas ringkasan AI
    await logActivityAction(
      "AI_SUMMARY",
      `AI menyusun ringkasan obrolan untuk tiket #${conversationId}`,
      { conversationId }
    );

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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    // 3. Jika pesan dikirim oleh agen, catat di log aktivitas audit
    if (senderType === "agent") {
      await logActivityAction(
        "SEND_MESSAGE",
        `Agen mengirim balasan ke tiket #${conversationId}`,
        { conversationId, messageId: message.id }
      );
    }

    // 4. Jika pesan dikirim oleh pelanggan, jalankan analisis sentimen AI
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

        // Catat di log audit aktivitas sistem
        await logActivityAction(
          "SYSTEM_ESCALATION",
          `Eskalasi darurat otomatis dipicu untuk tiket #${conversationId} (Sentimen: MARAH)`,
          { conversationId, customerName }
        );
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Hasilkan embedding 768 dimensi via Gemini text-embedding-004
    const embedding = await getEmbedding(content);

    // 2. Simpan ke database Supabase
    const { error } = await supabase.from("knowledge_embeddings").insert({
      title,
      content,
      embedding,
    });

    if (error) throw error;

    // Catat log aktivitas penambahan SOP
    await logActivityAction(
      "ADD_SOP",
      `Agen menambahkan dokumen SOP baru: "${title}"`,
      { title }
    );

    return true;
  } catch (error) {
    console.error("Action error adding SOP with vector embedding:", error);
    
    // Catat log aktivitas kegagalan penambahan SOP
    await logActivityAction(
      "SYSTEM_ERROR",
      `Gagal menambahkan dokumen SOP "${title}" akibat kendala teknis.`,
      { title, error: (error as any).message || String(error) }
    );

    return false;
  }
}

/**
 * Server Action: Mengambil data statistik dashboard riil dari Supabase.
 */
export async function getDashboardStatsAction() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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
