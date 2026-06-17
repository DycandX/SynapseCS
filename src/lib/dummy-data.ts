// ──────────────────────────────────────────────
// SynapseCS — Dummy Data
// All data is hardcoded for frontend-only mode
// ──────────────────────────────────────────────

export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export type ConversationStatus = "open" | "pending" | "closed";
export type Sentiment = "marah" | "netral" | "puas";

export interface Conversation {
  id: string;
  customerId: string;
  agentId: string | null;
  status: ConversationStatus;
  sentiment: Sentiment;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  unread: boolean;
}

export type SenderType = "customer" | "agent" | "ai_system";

export interface Message {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface KnowledgeEmbedding {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

// ──────── Users ────────
export const users: User[] = [
  {
    id: "u1",
    name: "Rina Agustina",
    email: "rina@synapsecs.com",
    role: "admin",
  },
  {
    id: "u2",
    name: "Budi Santoso",
    email: "budi@synapsecs.com",
    role: "agent",
  },
  {
    id: "u3",
    name: "Dian Purnama",
    email: "dian@synapsecs.com",
    role: "agent",
  },
];

// ──────── Customers ────────
export const customers: Customer[] = [
  {
    id: "c1",
    name: "Ahmad Fauzi",
    email: "ahmad.fauzi@gmail.com",
    phone: "+6281234567890",
    createdAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "c2",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@yahoo.com",
    phone: "+6281345678901",
    createdAt: "2026-05-12T10:30:00Z",
  },
  {
    id: "c3",
    name: "Rudi Hermawan",
    email: "rudi.h@outlook.com",
    phone: "+6281456789012",
    createdAt: "2026-05-15T14:00:00Z",
  },
  {
    id: "c4",
    name: "Maya Sari",
    email: "maya.sari@gmail.com",
    phone: "+6281567890123",
    createdAt: "2026-05-20T09:15:00Z",
  },
  {
    id: "c5",
    name: "Teguh Prasetyo",
    email: "teguh.p@proton.me",
    phone: "+6281678901234",
    createdAt: "2026-06-01T11:00:00Z",
  },
  {
    id: "c6",
    name: "Lina Marlina",
    email: "lina.m@gmail.com",
    phone: "+6281789012345",
    createdAt: "2026-06-05T16:30:00Z",
  },
];

// ──────── Conversations ────────
export const conversations: Conversation[] = [
  {
    id: "conv1",
    customerId: "c1",
    agentId: "u2",
    status: "open",
    sentiment: "marah",
    aiSummary: null,
    createdAt: "2026-06-17T08:00:00Z",
    updatedAt: "2026-06-17T10:30:00Z",
    unread: true,
  },
  {
    id: "conv2",
    customerId: "c2",
    agentId: "u2",
    status: "open",
    sentiment: "netral",
    aiSummary: null,
    createdAt: "2026-06-17T09:15:00Z",
    updatedAt: "2026-06-17T09:45:00Z",
    unread: true,
  },
  {
    id: "conv3",
    customerId: "c3",
    agentId: "u3",
    status: "pending",
    sentiment: "netral",
    aiSummary:
      "Pelanggan menanyakan status pengiriman pesanan #ORD-4821. Pesanan sudah dikirim melalui kurir JNE dan estimasi tiba besok.",
    createdAt: "2026-06-16T14:00:00Z",
    updatedAt: "2026-06-17T08:00:00Z",
    unread: false,
  },
  {
    id: "conv4",
    customerId: "c4",
    agentId: null,
    status: "open",
    sentiment: "marah",
    aiSummary: null,
    createdAt: "2026-06-17T10:00:00Z",
    updatedAt: "2026-06-17T10:30:00Z",
    unread: true,
  },
  {
    id: "conv5",
    customerId: "c5",
    agentId: "u3",
    status: "closed",
    sentiment: "puas",
    aiSummary:
      "Pelanggan puas dengan resolusi masalah pengembalian dana. Dana dikembalikan dalam 3 hari kerja.",
    createdAt: "2026-06-15T10:00:00Z",
    updatedAt: "2026-06-16T15:00:00Z",
    unread: false,
  },
  {
    id: "conv6",
    customerId: "c6",
    agentId: "u2",
    status: "open",
    sentiment: "netral",
    aiSummary: null,
    createdAt: "2026-06-17T11:00:00Z",
    updatedAt: "2026-06-17T11:30:00Z",
    unread: true,
  },
  {
    id: "conv7",
    customerId: "c1",
    agentId: "u2",
    status: "closed",
    sentiment: "puas",
    aiSummary:
      "Masalah login berhasil diselesaikan setelah reset password. Pelanggan sudah bisa mengakses akun.",
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-10T11:00:00Z",
    unread: false,
  },
];

// ──────── Messages ────────
export const messages: Message[] = [
  // conv1 — Ahmad Fauzi (marah)
  {
    id: "m1",
    conversationId: "conv1",
    senderType: "customer",
    content:
      "Halo, saya sangat kecewa! Barang yang saya pesan sudah 2 minggu belum sampai. Ini tidak bisa diterima!",
    createdAt: "2026-06-17T08:00:00Z",
  },
  {
    id: "m2",
    conversationId: "conv1",
    senderType: "customer",
    content:
      "Nomor pesanan saya #ORD-7291. Saya sudah bayar lunas tapi tidak ada kejelasan. Kalau tidak bisa ditangani, saya minta refund sekarang!",
    createdAt: "2026-06-17T08:02:00Z",
  },
  {
    id: "m3",
    conversationId: "conv1",
    senderType: "agent",
    content:
      "Selamat pagi, Pak Ahmad. Kami mohon maaf atas ketidaknyamanan ini. Saya akan cek status pesanan Anda sekarang. Mohon ditunggu sebentar.",
    createdAt: "2026-06-17T08:10:00Z",
  },
  {
    id: "m4",
    conversationId: "conv1",
    senderType: "ai_system",
    content:
      "📊 Analisis Sentimen: MARAH — Pelanggan mengekspresikan kekecewaan tinggi terkait keterlambatan pengiriman dan mengancam meminta refund.",
    createdAt: "2026-06-17T08:10:30Z",
  },
  {
    id: "m5",
    conversationId: "conv1",
    senderType: "agent",
    content:
      "Pak Ahmad, saya sudah mengecek pesanan #ORD-7291. Ternyata ada kendala di gudang ekspedisi sehingga pengiriman tertunda. Saya akan eskalasi dan pastikan paket dikirim hari ini.",
    createdAt: "2026-06-17T08:20:00Z",
  },
  {
    id: "m6",
    conversationId: "conv1",
    senderType: "customer",
    content:
      "Pastikan ya. Kalau besok belum sampai, saya akan report dan minta full refund.",
    createdAt: "2026-06-17T08:25:00Z",
  },
  {
    id: "m7",
    conversationId: "conv1",
    senderType: "agent",
    content:
      "Baik, Pak Ahmad. Kami akan pantau terus. Saya akan update Bapak segera setelah ada perkembangan. Terima kasih atas kesabarannya.",
    createdAt: "2026-06-17T08:30:00Z",
  },

  // conv2 — Siti Nurhaliza (netral)
  {
    id: "m8",
    conversationId: "conv2",
    senderType: "customer",
    content:
      "Permisi, saya mau tanya cara ganti alamat pengiriman. Pesanan saya belum dikirim kan?",
    createdAt: "2026-06-17T09:15:00Z",
  },
  {
    id: "m9",
    conversationId: "conv2",
    senderType: "agent",
    content:
      "Halo, Kak Siti! Tentu, bisa dibantu. Boleh infokan nomor pesanannya?",
    createdAt: "2026-06-17T09:20:00Z",
  },
  {
    id: "m10",
    conversationId: "conv2",
    senderType: "customer",
    content:
      "Nomor pesanan #ORD-8102. Saya mau ganti ke Jl. Merpati No. 15, Jakarta Selatan.",
    createdAt: "2026-06-17T09:25:00Z",
  },
  {
    id: "m11",
    conversationId: "conv2",
    senderType: "agent",
    content:
      "Baik, Kak Siti. Pesanan #ORD-8102 belum diproses kirim jadi masih bisa diubah. Saya update alamatnya sekarang ya.",
    createdAt: "2026-06-17T09:30:00Z",
  },
  {
    id: "m12",
    conversationId: "conv2",
    senderType: "customer",
    content: "Terima kasih banyak! 🙏",
    createdAt: "2026-06-17T09:35:00Z",
  },

  // conv3 — Rudi Hermawan (netral, pending)
  {
    id: "m13",
    conversationId: "conv3",
    senderType: "customer",
    content:
      "Halo, saya ingin menanyakan status pengiriman pesanan saya #ORD-4821.",
    createdAt: "2026-06-16T14:00:00Z",
  },
  {
    id: "m14",
    conversationId: "conv3",
    senderType: "agent",
    content:
      "Halo, Pak Rudi. Pesanan #ORD-4821 sudah dikirim melalui JNE dengan nomor resi JNE-9812345678. Estimasi tiba besok.",
    createdAt: "2026-06-16T14:15:00Z",
  },
  {
    id: "m15",
    conversationId: "conv3",
    senderType: "customer",
    content: "Baik, terima kasih infonya. Saya tunggu ya.",
    createdAt: "2026-06-16T14:20:00Z",
  },

  // conv4 — Maya Sari (marah, unassigned)
  {
    id: "m16",
    conversationId: "conv4",
    senderType: "customer",
    content:
      "TOLONG!! Akun saya terkunci dan saya tidak bisa login sama sekali! Saya sudah coba reset password 3 kali tetap gagal!",
    createdAt: "2026-06-17T10:00:00Z",
  },
  {
    id: "m17",
    conversationId: "conv4",
    senderType: "customer",
    content:
      "Ini sangat mendesak, saya harus mengakses akun untuk urusan pekerjaan penting hari ini!",
    createdAt: "2026-06-17T10:05:00Z",
  },
  {
    id: "m18",
    conversationId: "conv4",
    senderType: "ai_system",
    content:
      "📊 Analisis Sentimen: MARAH — Pelanggan mengalami masalah akses akun yang mendesak dan menunjukkan frustrasi tinggi.",
    createdAt: "2026-06-17T10:05:30Z",
  },

  // conv5 — Teguh (puas, closed)
  {
    id: "m19",
    conversationId: "conv5",
    senderType: "customer",
    content:
      "Halo, saya ingin menanyakan soal pengembalian dana untuk pesanan #ORD-3310 yang saya batalkan.",
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "m20",
    conversationId: "conv5",
    senderType: "agent",
    content:
      "Halo, Pak Teguh. Pembatalan pesanan #ORD-3310 sudah diproses. Dana akan dikembalikan dalam 3 hari kerja ke rekening Anda.",
    createdAt: "2026-06-15T10:15:00Z",
  },
  {
    id: "m21",
    conversationId: "conv5",
    senderType: "customer",
    content: "Mantap, sudah masuk dananya. Terima kasih pelayanannya! 👍",
    createdAt: "2026-06-16T15:00:00Z",
  },

  // conv6 — Lina Marlina (netral)
  {
    id: "m22",
    conversationId: "conv6",
    senderType: "customer",
    content:
      "Halo, saya mau tanya apakah produk XYZ-200 masih tersedia? Dan apakah ada promo untuk pembelian grosir?",
    createdAt: "2026-06-17T11:00:00Z",
  },
  {
    id: "m23",
    conversationId: "conv6",
    senderType: "agent",
    content:
      "Halo, Kak Lina! Produk XYZ-200 masih tersedia. Untuk pembelian grosir di atas 50 pcs, kami bisa berikan diskon 15%. Tertarik?",
    createdAt: "2026-06-17T11:10:00Z",
  },
  {
    id: "m24",
    conversationId: "conv6",
    senderType: "customer",
    content:
      "Wah menarik! Kalau saya pesan 100 pcs, bisa dapat harga lebih baik?",
    createdAt: "2026-06-17T11:15:00Z",
  },
];

// ──────── Knowledge Base (SOP) ────────
export const knowledgeBase: KnowledgeEmbedding[] = [
  {
    id: "kb1",
    title: "SOP Penanganan Keluhan Pelanggan",
    content:
      "Langkah 1: Sapa pelanggan dengan ramah dan empati. Langkah 2: Identifikasi masalah utama. Langkah 3: Berikan solusi sesuai kebijakan. Langkah 4: Follow-up dalam 24 jam. Langkah 5: Pastikan pelanggan puas sebelum menutup tiket.",
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "kb2",
    title: "SOP Pengembalian Dana (Refund)",
    content:
      "Refund dapat diproses jika: 1) Pesanan dibatalkan sebelum dikirim. 2) Barang cacat/rusak saat diterima (sertakan foto). 3) Barang tidak sesuai deskripsi. Proses refund: 3-5 hari kerja ke rekening asal. Batas waktu klaim: 7 hari setelah penerimaan.",
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "kb3",
    title: "SOP Perubahan Alamat Pengiriman",
    content:
      "Perubahan alamat hanya bisa dilakukan jika pesanan belum masuk proses pengiriman (status: Diproses). Hubungi tim logistik melalui channel internal untuk update. Konfirmasi perubahan ke pelanggan via chat.",
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "kb4",
    title: "SOP Eskalasi Masalah ke Supervisor",
    content:
      "Eskalasi diperlukan jika: 1) Pelanggan mengancam tindakan hukum. 2) Nilai transaksi di atas Rp 5.000.000. 3) Masalah teknis yang tidak bisa diselesaikan agen. 4) Pelanggan meminta bicara dengan atasan. Catat semua detail sebelum eskalasi.",
    updatedAt: "2026-06-05T08:00:00Z",
  },
  {
    id: "kb5",
    title: "SOP Reset Password Pelanggan",
    content:
      "Langkah 1: Verifikasi identitas pelanggan (email + nomor telepon terdaftar). Langkah 2: Kirim link reset password via email terdaftar. Langkah 3: Jika email tidak bisa diakses, lakukan verifikasi KTP. Langkah 4: Reset manual oleh admin teknis.",
    updatedAt: "2026-06-03T12:00:00Z",
  },
];

// ──────── Helper functions ────────

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getConversationsByCustomerId(
  customerId: string
): Conversation[] {
  return conversations.filter((c) => c.customerId === customerId);
}

export function getMessagesByConversationId(
  conversationId: string
): Message[] {
  return messages.filter((m) => m.conversationId === conversationId);
}

export function getAgentById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getConversationWithDetails(conversationId: string) {
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return null;

  const customer = getCustomerById(conversation.customerId);
  const agent = conversation.agentId
    ? getAgentById(conversation.agentId)
    : null;
  const msgs = getMessagesByConversationId(conversationId);

  return { conversation, customer, agent, messages: msgs };
}

// AI simulation responses
export const aiDraftResponses: Record<string, string> = {
  conv1:
    "Yth. Pak Ahmad,\n\nKami memohon maaf yang sebesar-besarnya atas keterlambatan pengiriman pesanan #ORD-7291. Kami telah berkoordinasi langsung dengan pihak ekspedisi dan memastikan paket Anda akan dikirimkan hari ini.\n\nSebagai bentuk permohonan maaf, kami memberikan voucher diskon 10% untuk pembelian berikutnya. Kode voucher: SORRY10.\n\nApakah ada hal lain yang bisa kami bantu?\n\nHormat kami,\nTim SynapseCS",
  conv2:
    "Halo Kak Siti,\n\nPerubahan alamat untuk pesanan #ORD-8102 sudah berhasil diupdate ke:\nJl. Merpati No. 15, Jakarta Selatan.\n\nPesanan akan dikirim sesuai jadwal. Estimasi tiba: 2-3 hari kerja.\n\nTerima kasih! 🙏",
  conv4:
    "Yth. Kak Maya,\n\nKami memahami urgensi masalah ini. Kami telah melakukan reset akun Anda dari sistem. Silakan coba langkah berikut:\n\n1. Buka halaman login\n2. Klik 'Lupa Password'\n3. Masukkan email: maya.sari@gmail.com\n4. Cek inbox email (termasuk folder spam)\n5. Klik link reset dan buat password baru\n\nJika masih mengalami kendala, kami siap membantu melalui verifikasi identitas manual.\n\nSalam,\nTim SynapseCS",
  conv6:
    "Halo Kak Lina,\n\nTerima kasih atas minatnya! Untuk pembelian 100 pcs produk XYZ-200, kami bisa berikan harga spesial:\n\n- Diskon 20% dari harga normal\n- Free ongkir\n- Estimasi pengiriman: 5-7 hari kerja\n\nApakah Kak Lina ingin melanjutkan pemesanan? Kami bisa buatkan invoice sekarang.\n\nSalam hangat,\nTim SynapseCS",
};

export const aiSummaryResponses: Record<string, string[]> = {
  conv1: [
    "Pelanggan marah karena pesanan #ORD-7291 terlambat 2 minggu.",
    "Agen sudah identifikasi kendala di gudang ekspedisi dan akan eskalasi.",
    "Pelanggan mengancam minta refund jika besok belum sampai.",
  ],
  conv2: [
    "Pelanggan meminta perubahan alamat pengiriman pesanan #ORD-8102.",
    "Pesanan belum dikirim, perubahan masih bisa dilakukan.",
    "Alamat baru: Jl. Merpati No. 15, Jakarta Selatan.",
  ],
  conv3: [
    "Pelanggan menanyakan status pengiriman pesanan #ORD-4821.",
    "Pesanan sudah dikirim via JNE, resi: JNE-9812345678.",
    "Estimasi tiba hari berikutnya.",
  ],
  conv4: [
    "Pelanggan tidak bisa login — akun terkunci setelah 3x reset password gagal.",
    "Masalah sangat mendesak (urusan pekerjaan).",
    "Belum ada agen yang menangani — perlu eskalasi segera.",
  ],
  conv5: [
    "Pelanggan menanyakan pengembalian dana pesanan #ORD-3310.",
    "Refund diproses, dana masuk dalam 3 hari kerja.",
    "Pelanggan puas dengan resolusi.",
  ],
  conv6: [
    "Pelanggan menanyakan ketersediaan produk XYZ-200.",
    "Tertarik pembelian grosir 100 pcs, minta harga spesial.",
    "Agen sudah tawarkan diskon 15% untuk >50 pcs.",
  ],
};
