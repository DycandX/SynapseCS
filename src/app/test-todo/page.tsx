import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Uji Koneksi Supabase</h1>
      {todos && todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo: any) => (
            <li key={todo.id} className="p-3 bg-secondary rounded-lg border border-border">
              {todo.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          Tidak ada data todo ditemukan di tabel 'todos', atau tabel belum dibuat. Koneksi berhasil jika tidak ada error!
        </p>
      )}
    </div>
  );
}
