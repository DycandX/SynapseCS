"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-foreground antialiased font-sans">
        <div className="text-center p-8 border border-red-500/20 bg-red-500/5 rounded-2xl max-w-md mx-4">
          <h1 className="text-2xl font-bold text-red-500">Terjadi Kesalahan Fatal</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 text-sm">
            {error.message || "Terdapat kendala sistem yang tidak terduga."}
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
