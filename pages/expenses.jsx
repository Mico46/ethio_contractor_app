import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineSearch } from "react-icons/hi";

const CATEGORIES = ["labor", "material", "equipment", "transport", "permits", "utilities", "other"];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [formData, setFormData] = useState({ siteId: "", category: "", amount: "", note: "", date: "" });

  useEffect(() => { Promise.all([fetchExpenses(), fetchSites()]); }, []);

  async function fetchExpenses() {
    try { const res = await authFetch("/api/expenses"); if (res.ok) setExpenses(await res.json()); }
    catch { toast.error("Failed to fetch"); } finally { setLoading(false); }
  }

  async function fetchSites() {
    try { const res = await authFetch("/api/sites"); if (res.ok) setSites(await res.json()); } catch { /* */ }
  }

  function handleChange(e) { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...formData, id: editing.id, amount: Number(formData.amount) } : { ...formData, amount: Number(formData.amount) };
    const res = await authFetch("/api/expenses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); setEditing(null); fetchExpenses(); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/expenses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); fetchExpenses(); }
  }

  const formatETB = (a) => new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(a);
  const getSiteName = (sid) => sites.find((s) => s.id === sid)?.name || sid;

  const filtered = expenses.filter((e) => selectedSite ? e.siteId === selectedSite : true);
  const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Category breakdown
  const byCategory = {};
  filtered.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0); });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-muted-foreground">Total: <strong>{formatETB(total)}</strong></p>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ siteId: selectedSite, category: "", amount: "", note: "", date: "" }); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* Site filter */}
        <div className="card p-3 flex flex-col sm:flex-row gap-3">
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="input sm:w-64">
            <option value="">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Category breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="card p-3">
                <p className="text-xs text-muted-foreground uppercase font-medium">{cat}</p>
                <p className="text-lg font-bold text-gray-900">{formatETB(amt)}</p>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Expense" : "Add Expense"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select name="siteId" value={formData.siteId} onChange={handleChange} required className="input">
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} required className="input">
                  <option value="">Select</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETB)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input name="note" value={formData.note} onChange={handleChange} className="input" placeholder="Description" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">{editing ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-muted-foreground">No expenses found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((e) => (
              <div key={e.id} className="card card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="badge badge-primary">{e.category}</span>
                    <span className="font-semibold text-gray-900">{formatETB(e.amount || 0)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>Site: {getSiteName(e.siteId)}</span>
                    {e.date && <span>{e.date}</span>}
                  </div>
                  {e.note && <p className="text-sm text-muted-foreground mt-1">{e.note}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(e); setFormData({ siteId: e.siteId, category: e.category, amount: String(e.amount), note: e.note || "", date: e.date || "" }); setShowForm(true); }} className="btn-outline text-xs px-3 py-1.5">
                    <HiOutlinePencilAlt className="w-3.5 h-3.5 mr-1 inline" /> Edit
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="btn-danger text-xs px-3 py-1.5">
                    <HiOutlineTrash className="w-3.5 h-3.5 mr-1 inline" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
