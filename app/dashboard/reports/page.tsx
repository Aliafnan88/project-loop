"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Report = {
  id: string;
  title: string;
  createdAt: string;
  contentJson: { text: string };
};

export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function loadReports() {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadReports();
    }
  }, [status, router]);

  async function handleGenerate() {
    setGenerating(true);
    await fetch("/api/reports", { method: "POST" });
    setGenerating(false);
    loadReports();
  }

  if (status === "loading" || loading) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Voice-of-Customer Reports</h1>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="mt-4 rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {generating ? "Generating..." : "Generate New Report (last 30 days)"}
      </button>

      <div className="mt-8 max-w-3xl space-y-6">
        {reports.length === 0 && (
          <p className="text-gray-500">No reports yet. Generate one above.</p>
        )}

        {reports.map((r) => (
          <div key={r.id} className="rounded border p-4">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(r.createdAt).toLocaleString()}
            </p>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
              {r.contentJson.text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}