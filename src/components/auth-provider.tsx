"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type User, users } from "@/lib/dummy-data";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isUsingSupabase: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IS_SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(IS_SUPABASE_CONFIGURED ? true : false);

  // Sync Supabase session if configured
  useEffect(() => {
    if (!IS_SUPABASE_CONFIGURED) return;

    const fetchProfile = async (uid: string, fallbackEmail: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .single();

        if (profile && !error) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as "admin" | "agent",
          });
        } else {
          setUser({
            id: uid,
            name: fallbackEmail.split("@")[0],
            email: fallbackEmail,
            role: "agent",
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || "");
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || "");
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password = "demo123"): Promise<{ success: boolean; error?: string }> => {
    if (IS_SUPABASE_CONFIGURED) {
      setIsLoading(true);
      try {
        // Try sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setIsLoading(false);
            return {
              success: false,
              error: "Email belum dikonfirmasi. Harap nonaktifkan opsi 'Confirm email' di Dashboard Supabase Anda (Authentication -> Providers -> Email -> centang matikan 'Confirm email' lalu simpan).",
            };
          }

          // If user doesn't exist, try to sign up automatically for demo purposes
          if (
            error.message.includes("Invalid login credentials") ||
            error.message.includes("User not found")
          ) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: email.split("@")[0],
                  role: "agent",
                },
              },
            });

            if (signUpError) {
              console.error("Auto signup failed:", signUpError.message);
              setIsLoading(false);
              return { success: false, error: `Pendaftaran otomatis gagal: ${signUpError.message}` };
            }

            if (signUpData.user) {
              // If email confirmation is enabled, session might be null.
              if (!signUpData.session) {
                setIsLoading(false);
                return {
                  success: false,
                  error: "Akun demo berhasil didaftarkan! Namun, Anda perlu menonaktifkan opsi 'Confirm email' di Dashboard Supabase agar bisa langsung masuk tanpa verifikasi email.",
                };
              }
              return { success: true };
            }
          }
          console.error("Login failed:", error.message);
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        return { success: !!data.session };
      } catch (err: any) {
        console.error("Supabase auth error:", err);
        setIsLoading(false);
        return { success: false, error: err.message || "Terjadi kesalahan koneksi auth." };
      }
    } else {
      // Fallback to dummy data
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        setUser(found);
        return { success: true };
      }
      return { success: false, error: "Pengguna tidak ditemukan dalam basis data dummy." };
    }
  };

  const logout = async () => {
    if (IS_SUPABASE_CONFIGURED) {
      setIsLoading(true);
      await supabase.auth.signOut();
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isUsingSupabase: !!IS_SUPABASE_CONFIGURED,
        isLoading,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
