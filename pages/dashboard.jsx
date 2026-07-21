import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import {
  HiOutlineMap,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineCash,
} from "react-icons/hi";

const STAT_CARDS = [
  { key: "totalSites", label: "Total Sites", icon: HiOutlineMap, color: "text-primary", bg: "bg-blue-50" },
  { key: "activeSites", label: "Active Sites", icon: HiOutlineClipboardCheck, color: "text-secondary", bg: "bg-teal-50" },
  { key: "totalWorkers", label: "Workers", icon: HiOutlineUsers, color: "text-accent", bg: "bg-purple-50" },
  { key: "totalBudget", label: "Total Budget", icon: HiOutlineCash, color: "text-success", bg: "bg-green-50", isCurrency: true },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalBudget: 0,
    totalExpenses: 0,
    totalWorkers: 0,
    pendingSync: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await authFetch("/api/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatETB = (amount) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                const value = card.isCurrency
                  ? formatETB(stats[card.key] || 0)
                  : stats[card.key] || 0;
                return (
                  <div key={card.key} className="card card-hover p-4 lg:p-5">
                    <div className="flex items-center gap-3">
                      <div className={`${card.bg} p-2.5 rounded-lg`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {card.label}
                        </p>
                        <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                          {value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-5">
              <div className="card p-5">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-danger">{formatETB(stats.totalExpenses || 0)}</p>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-danger h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.totalBudget ? Math.min((stats.totalExpenses / stats.totalBudget) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalBudget
                    ? Math.round((stats.totalExpenses / stats.totalBudget) * 100)
                    : 0}% of budget used
                </p>
              </div>
              <div className="card p-5">
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Sync</p>
                <p className="text-2xl font-bold text-warning">{stats.pendingSync || 0}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {stats.pendingSync === 0
                    ? "All data is synced"
                    : "Items waiting to sync to cloud"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { href: "/sites", label: "Sites", icon: HiOutlineMap, color: "bg-blue-50 text-primary" },
                  { href: "/tasks", label: "Tasks", icon: HiOutlineClipboardCheck, color: "bg-purple-50 text-accent" },
                  { href: "/users", label: "HR & Staff", icon: HiOutlineUsers, color: "bg-teal-50 text-secondary" },
                  { href: "/photos", label: "Photos", icon: HiOutlineCash, color: "bg-amber-50 text-warning" },
                  { href: "/logs", label: "Logs", icon: HiOutlineCash, color: "bg-green-50 text-success" },
                  { href: "/reports", label: "Reports", icon: HiOutlineCash, color: "bg-red-50 text-danger" },
                ].map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className={`${action.color} p-2.5 rounded-lg`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
