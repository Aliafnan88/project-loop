 "use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";

type Stats = {
  total: number;
  newThisWeek: number;
  newCount: number;
  byChannel: { channel: string; count: number }[];
  byStatus: { status: string; count: number }[];
  volumeOverTime: { date: string; count: number }[];
};

const COLORS = ["#000000", "#666666", "#999999", "#cccccc", "#333333"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/dashboard-stats")
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Log out
        </button>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        Logged in as: {session?.user?.email}
      </p>

       <div className="mt-4 flex gap-4">
  <Link href="/dashboard/feedback" className="text-sm underline">
    View Feedback →
  </Link>
  <Link href="/dashboard/members" className="text-sm underline">
    Manage Members →
  </Link>
  <Link href="/dashboard/ask" className="text-sm underline">
    Ask LOOP →
  </Link>
  <Link href="/dashboard/reports" className="text-sm underline">
  Reports →
</Link>
<Link href="/dashboard/themes" className="text-sm underline">
  Themes →
</Link>
</div>
      {/* Stat cards */}
      <div className="mt-6 grid max-w-3xl grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-xs text-gray-500">Total Feedback</p>
          <p className="text-2xl font-semibold">{stats?.total ?? 0}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-500">New (last 7 days)</p>
          <p className="text-2xl font-semibold">{stats?.newThisWeek ?? 0}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-500">Status: New</p>
          <p className="text-2xl font-semibold">{stats?.newCount ?? 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="text-sm font-semibold">
            Volume over time (last 7 days)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.volumeOverTime}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#000000" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border p-4">
          <h2 className="text-sm font-semibold">Sentiment / Status breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats?.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {stats?.byStatus.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">Top channels</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.byChannel}>
              <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}