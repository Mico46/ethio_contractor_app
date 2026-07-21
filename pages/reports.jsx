import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { HiOutlineCash, HiOutlineMap, HiOutlineClipboardCheck } from "react-icons/hi";

export default function Reports() {
  const [sites, setSites] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [sitesRes, expensesRes] = await Promise.all([authFetch("/api/sites"), authFetch("/api/expenses")]);
      if (sitesRes.ok) setSites(await sitesRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch { console.error("Failed to fetch data"); }
    finally { setLoading(false); }
  }

  const formatETB = (amount) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);

  const chartData = sites.map((site) => ({
    name: site.name?.length > 12 ? site.name.substring(0, 12) + "..." : site.name,
    budget: site.budget || 0,
    expenses: expenses.filter((e) => e.siteId === site.id).reduce((sum, e) => sum + (e.amount || 0), 0),
  }));

  const totalBudget = sites.reduce((sum, s) => sum + (s.budget || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const activeSites = sites.filter((s) => s.status === "active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5 flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl"><HiOutlineCash className="w-6 h-6 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Budget</p>
                  <p className="text-xl font-bold text-gray-900">{formatETB(totalBudget)}</p>
                </div>
              </div>
              <div className="card p-5 flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl"><HiOutlineCash className="w-6 h-6 text-danger" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Expenses</p>
                  <p className="text-xl font-bold text-gray-900">{formatETB(totalExpenses)}</p>
                </div>
              </div>
              <div className="card p-5 flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-xl"><HiOutlineMap className="w-6 h-6 text-success" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Active Sites</p>
                  <p className="text-xl font-bold text-gray-900">{activeSites}</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Expenses</h2>
              <div className="w-full h-64 sm:h-80">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatETB(value)} />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f97316" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-gray-900">Site Details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Site</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{site.name}</td>
                        <td className="px-4 py-3"><span className="badge badge-primary">{site.status}</span></td>
                        <td className="px-4 py-3 text-sm">{formatETB(site.budget || 0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${site.progress || 0}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{site.progress || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
