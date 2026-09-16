"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AskLoopPage() {
  const { status } = useSession();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAnswer("");
    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setAnswer(data.answer);
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Ask LOOP</h1>
      <p className="mt-1 text-sm text-gray-600">
        Ask a question in plain English, grounded in your actual feedback data.
      </p>

      <form onSubmit={handleAsk} className="mt-4 max-w-2xl space-y-3">
        <textarea
          placeholder="What are users saying about onboarding?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded border px-3 py-2"
          rows={2}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {answer && (
        <div className="mt-6 max-w-2xl rounded border bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-sm">{answer}</p>
        </div>
      )}
    </div>
  );
}