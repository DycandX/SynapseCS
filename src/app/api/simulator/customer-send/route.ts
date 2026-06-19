import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { sendMessageAction } from "@/app/actions";

/**
 * POST /api/simulator/customer-send
 * Mensimulasikan masuknya pesan pelanggan secara real-time.
 * 
 * Body:
 * {
 *   "conversation_id": "optional-uuid",
 *   "customer_id": "optional-uuid",
 *   "content": "Isi pesan komplain/tanya dari pelanggan"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body;
    let { conversation_id, customer_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Parameter 'content' wajib diisi." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Jika customer_id tidak dikirim, ambil customer pertama di database
    if (!customer_id) {
      const { data: firstCustomer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .limit(1)
        .single();

      if (customerError || !firstCustomer) {
        return NextResponse.json(
          { error: "Tidak ada pelanggan terdaftar di basis data. Jalankan setup.sql." },
          { status: 404 }
        );
      }
      customer_id = firstCustomer.id;
    }

    // 2. Jika conversation_id tidak dikirim, buat percakapan baru untuk customer tersebut
    if (!conversation_id) {
      const { data: newConvo, error: convoError } = await supabase
        .from("conversations")
        .insert({
          customer_id,
          status: "open",
          sentiment: "netral",
        })
        .select()
        .single();

      if (convoError || !newConvo) {
        return NextResponse.json(
          { error: "Gagal membuat percakapan baru: " + convoError?.message },
          { status: 500 }
        );
      }
      conversation_id = newConvo.id;
    }

    // 3. Panggil Server Action sendMessageAction untuk memproses pesan masuk
    // Action ini otomatis menjalankan analisis sentimen, mengubah status, eskalasi marah, dan Resend email.
    const result = await sendMessageAction(conversation_id, content, "customer");

    if (!result.success) {
      return NextResponse.json(
        { error: "Gagal memproses pesan: " + result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pesan pelanggan berhasil disimulasikan.",
      conversation_id,
      message_data: result.message,
    });
  } catch (error: any) {
    console.error("Simulator API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal: " + error.message },
      { status: 500 }
    );
  }
}
