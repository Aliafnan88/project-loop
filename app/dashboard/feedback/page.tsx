"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type FeedbackItem = {
  id: string;
  content: string;
  channel: string;
  status: string;
  createdAt: string;
};

export default function FeedbackPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("support_ticket");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [simulating, setSimulating] = useState(false);

  function loadFeedback() {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      search,
      channel: channelFilter,
      status: statusFilter,
    });

    fetch(`/api/feedback?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setFeedback(data.feedback || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (authStatus === "authenticated") {
      loadFeedback();
    }
  }, [authStatus, page, search, channelFilter, statusFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, channel }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setContent("");
    loadFeedback();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/feedback/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setUploadMsg(data.error || "Upload failed");
      return;
    }

    setUploadMsg(`Imported: ${data.imported}, Failed: ${data.failed}`);
    loadFeedback();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSimulate() {
    setSimulating(true);
    setUploadMsg("");

    const res = await fetch("/api/feedback/simulate", {
      method: "POST",
    });

    const data = await res.json();
    setSimulating(false);

    if (!res.ok) {
      setUploadMsg(data.error || "Something went wrong");
      return;
    }

    setUploadMsg(`Simulated ${data.imported} feedback items imported`);
    loadFeedback();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadFeedback();
  }

  if (authStatus === "loading") {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Feedback</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-4 max-w-lg space-y-3 rounded-lg border p-4"
      >
        {error && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <textarea
          placeholder="Feedback content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded border px-3 py-2"
          rows={3}
          required
        />

        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="support_ticket">Support Ticket</option>
          <option value="app_store_review">App Store Review</option>
          <option value="nps_survey">NPS Survey</option>
          <option value="sales_call_note">Sales Call Note</option>
          <option value="community_post">Community Post</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Feedback"}
        </button>
      </form>

      <div className="mt-6 max-w-lg rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Bulk Import (CSV)</h2>
        <p className="mt-1 text-xs text-gray-500">
          CSV columns: content, channel, customer_label
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="mt-3 text-sm"
        />

        <div className="mt-3">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            {simulating
              ? "Importing..."
              : "Import from Support Channel (Simulated)"}
          </button>
        </div>

        {uploading && (
          <p className="mt-2 text-sm text-gray-600">Uploading...</p>
        )}
        {uploadMsg && (
          <p className="mt-2 text-sm text-green-700">{uploadMsg}</p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold">All Feedback</h2>

      <div className="mt-4 flex max-w-2xl flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="rounded border px-3 py-2 text-sm"
        />

        <select
          value={channelFilter}
          onChange={(e) => {
            setPage(1);
            setChannelFilter(e.target.value);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Channels</option>
          <option value="support_ticket">Support Ticket</option>
          <option value="app_store_review">App Store Review</option>
          <option value="nps_survey">NPS Survey</option>
          <option value="sales_call_note">Sales Call Note</option>
          <option value="community_post">Community Post</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="ACTIONED">Actioned</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-4">Loading...</p>
      ) : (
        <>
          <div className="mt-4 max-w-2xl space-y-2">
            {feedback.length === 0 && (
              <p className="text-gray-500">No feedback found.</p>
            )}
            {feedback.map((f) => (
              <div key={f.id} className="rounded border p-3">
                <p>{f.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{f.channel}</p>
                  <select
                    value={f.status}
                    onChange={(e) => handleStatusChange(f.id, e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="ACTIONED">Actioned</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex max-w-2xl items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}