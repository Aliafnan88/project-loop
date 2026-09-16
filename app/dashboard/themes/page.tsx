"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ThemeItem = {
  id: string;
  name: string;
  count: number;
  feedbackItems: { id: string; content: string; channel: string }[];
};

export default function ThemesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/themes")
        .then((res) => res.json())
        .then((data) => {
          setThemes(data.themes || []);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return <p className="p-8">Loading...</p>;
  }

  const maxCount = Math.max(...themes.map((t) => t.count), 1);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Themes & Trends</h1>

      {themes.length === 0 && (
        <p className="mt-4 text-gray-500">
          No themes yet. Add some feedback first.
        </p>
      )}

      <div className="mt-6 max-w-2xl space-y-3">
        {themes.map((t) => (
          <div key={t.id} className="rounded border p-3">
            <button
              onClick={() =>
                setExpanded(expanded === t.id ? null : t.id)
              }
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-gray-500">
                  {t.count} items
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-gray-100">
                <div
                  className="h-2 rounded bg-black"
                  style={{ width: `${(t.count / maxCount) * 100}%` }}
                />
              </div>
            </button>

            {expanded === t.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {t.feedbackItems.map((f) => (
                  <div key={f.id} className="text-sm text-gray-700">
                    <p>{f.content}</p>
                    <p className="text-xs text-gray-400">{f.channel}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}