import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Request-scoped cached query to fetch conversations.
 */
export const getConversations = cache(async (cookieStore: CookieStore) => {
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("conversations")
    .select(`
      id,
      customer_id,
      status,
      sentiment,
      ai_summary,
      created_at,
      updated_at,
      customers (id, name, email, phone),
      profiles (id, name, role),
      messages (id, sender_type, content, created_at)
    `)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data || [];
});

/**
 * Request-scoped cached query to fetch a single conversation with customer and agent profiles.
 */
export const getConversationById = cache(async (cookieStore: CookieStore, id: string) => {
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("conversations")
    .select("*, customers(*), profiles(*)")
    .eq("id", id)
    .single();
  return data;
});

/**
 * Request-scoped cached query to fetch messages for a conversation.
 */
export const getMessages = cache(async (cookieStore: CookieStore, conversationId: string) => {
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("messages")
    .select("id, sender_type, content, attachment_url, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(50);
  return data || [];
});

/**
 * Persistent cross-request cache for dashboard stats revalidated every 30 seconds.
 * Cookies list is passed as an argument to avoid using dynamic cookies() directly inside the cache scope.
 */
export const getCachedStats = unstable_cache(
  async (cookiesList: any[]) => {
    const mockCookieStore = {
      getAll() {
        return cookiesList;
      },
      set() {}
    } as any;
    const supabase = createClient(mockCookieStore);
    const { data } = await supabase
      .from("conversations")
      .select("id, status, sentiment");
    return data || [];
  },
  ["dashboard-stats"],
  { revalidate: 30 }
);

/**
 * Request-scoped cached query for paginated conversations.
 */
export const getConversationsPaginated = cache(
  async (cookieStore: CookieStore, cursor?: string, limit = 20) => {
    const supabase = createClient(cookieStore);

    let query = supabase
      .from("conversations")
      .select(`
        id,
        customer_id,
        status,
        sentiment,
        ai_summary,
        created_at,
        updated_at,
        customers (id, name, email, phone),
        profiles (id, name, role),
        messages (id, sender_type, content, created_at)
      `)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data } = await query;
    const hasMore = data ? data.length > limit : false;
    if (hasMore) data?.pop();
    const nextCursor = data && data.length > 0 ? data[data.length - 1].created_at : null;

    return { data: data || [], nextCursor, hasMore };
  }
);

/**
 * Request-scoped cached query for paginated messages.
 */
export const getMessagesPaginated = cache(
  async (cookieStore: CookieStore, conversationId: string, before?: string) => {
    const supabase = createClient(cookieStore);

    let query = supabase
      .from("messages")
      .select("id, sender_type, content, attachment_url, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data } = await query;
    const hasMore = data && data.length >= 30;
    const prevCursor = data && data.length > 0 ? data[data.length - 1].created_at : null;

    return { data: (data || []).reverse(), prevCursor, hasMore };
  }
);
