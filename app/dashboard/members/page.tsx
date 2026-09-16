"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function MembersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  function loadMembers() {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMembers(data.members);
        }
        setLoading(false);
      });
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadMembers();
    }
  }, [status, router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);

    const res = await fetch("/api/members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setInviteError(data.error || "Something went wrong");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("VIEWER");
    loadMembers();
  }

  if (status === "loading" || loading) {
    return <p className="p-8">Loading...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Workspace Members</h1>

      <table className="mt-4 w-full max-w-2xl border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="py-2">{m.name}</td>
              <td className="py-2">{m.email}</td>
              <td className="py-2">{m.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">Invite Member</h2>

      <form
        onSubmit={handleInvite}
        className="mt-4 max-w-sm space-y-3 rounded-lg border p-4"
      >
        {inviteError && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {inviteError}
          </p>
        )}

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="VIEWER">Viewer</option>
          <option value="ANALYST">Analyst</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button
          type="submit"
          disabled={inviting}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {inviting ? "Adding..." : "Add Member"}
        </button>
      </form>
    </div>
  );
}