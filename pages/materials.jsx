import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineSearch, HiOutlineCollection } from "react-icons/hi";

const UNITS = ["kg", "tons", "m", "m2", "m3", "pcs", "bags", "rolls", "liters", "boxes", "bundles", "sheets"];
// Flutter MaterialEntry.type is either "Incoming" or "Used"
const ENTRY_TYPES = ["Incoming", "Used"];

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    siteId: "", name: "", quantity: "", unit: "pcs", type: "Incoming", date: "",
  });

  useEffect(() => { Promise.all([fetchMaterials(), fetchSites()]); }, []);

  async function fetchMaterials() {
    try { const res = await authFetch("/api/materials"); if (res.ok) setMaterials(await res.json()); }
    catch { toast.error("Failed to fetch materials"); } finally { setLoading(false); }
  }

  async function fetchSites() {
    try { const res = await authFetch("/api/sites"); if (res.ok) setSites(await res.json()); } catch { /* */ }
  }

  function handleChange(e) { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { ...formData, id: editing.id, quantity: Number(formData.quantity) }
        : { ...formData, quantity: Number(formData.quantity) };
      const res = await authFetch("/api/materials", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); setEditing(null); resetForm(); fetchMaterials(); }
      else { toast.error("Failed to save"); }
    } catch { toast.error("Error saving"); }
  }

  function resetForm() { setFormData({ siteId: selectedSite, name: "", quantity: "", unit: "pcs", type: "Incoming", date: "" }); }

  function handleEdit(m) {
    setEditing(m);
    setFormData({ siteId: m.siteId || "", name: m.name || "", quantity: m.quantity || "", unit: m.unit || "pcs", type: m.type || "Incoming", date: m.date || "" });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    try { const res = await authFetch("/api/materials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (res.ok) { toast.success("Deleted!"); fetchMaterials(); } } catch { toast.error("Error"); }
  }

  const getSiteName = (siteId) => sites.find((s) => s.id === siteId)?.name || siteId;

  // Filter by selected site and search
  const siteMaterials = materials.filter((m) => {
    if (selectedSite && m.siteId !== selectedSite) return false;
    if (searchTerm && !m.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Stock balance: group by name+unit
  const stockBalance = {};
  siteMaterials.forEach((m) => {
    const key = `${(m.name || "").toLowerCase()}|${(m.unit || "").toLowerCase()}`;
    if (!stockBalance[key]) stockBalance[key] = { name: m.name, unit: m.unit, incoming: 0, used: 0 };
    const qty = Number(m.quantity) || 0;
    if (m.type === "Incoming") stockBalance[key].incoming += qty;
    else stockBalance[key].used += qty;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Materials</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Entry
          </button>
        </div>

        {/* Site filter */}
        <div className="card p-3 flex flex-col sm:flex-row gap-3">
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="input sm:w-64">
            <option value="">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center gap-2 flex-1">
            <HiOutlineSearch className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search materials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input border-0 shadow-none focus:ring-0" />
          </div>
        </div>

        {/* Stock Balance Summary */}
        {selectedSite && Object.keys(stockBalance).length > 0 && (
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Balance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(stockBalance).map((item) => {
                const balance = item.incoming - item.used;
                const ratio = item.incoming > 0 ? item.used / item.incoming : 0;
                const status = balance <= 0 ? "depleted" : ratio > 0.8 ? "low" : "in_stock";
                const statusStyle = {
                  depleted: { color: "text-danger", bg: "bg-red-50", bar: "bg-danger", label: "Depleted" },
                  low: { color: "text-warning", bg: "bg-amber-50", bar: "bg-warning", label: "Low Stock" },
                  in_stock: { color: "text-success", bg: "bg-green-50", bar: "bg-success", label: "In Stock" },
                }[status];
                return (
                  <div key={`${item.name}-${item.unit}`} className={`rounded-lg border p-4 ${statusStyle.bg}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                      </div>
                      <span className={`badge ${status === "depleted" ? "badge-danger" : status === "low" ? "badge-warning" : "badge-success"}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Incoming: <strong className="text-gray-900">{item.incoming}</strong></span>
                      <span className="text-muted-foreground">Used: <strong className="text-gray-900">{item.used}</strong></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div className={`${statusStyle.bar} h-2 rounded-full transition-all`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                    </div>
                    <p className={`text-sm font-semibold ${statusStyle.color}`}>Balance: {balance} {item.unit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Entry" : "Add Material Entry"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select name="siteId" value={formData.siteId} onChange={handleChange} required className="input">
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="input">
                  {ENTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="input" placeholder="e.g. Portland Cement" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" step="0.01" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className="input">
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">{editing ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Materials list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : siteMaterials.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineCollection className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No materials found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {siteMaterials.map((m) => (
              <div key={m.id} className="card card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type === "Incoming" ? "bg-green-50 text-success" : "bg-orange-50 text-warning"}`}>
                  <span className="text-lg">{m.type === "Incoming" ? "+" : "-"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900">{m.name}</h3>
                    <span className={`badge ${m.type === "Incoming" ? "badge-success" : "badge-warning"}`}>{m.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.quantity} {m.unit} {m.date ? `- ${m.date}` : ""}
                  </p>
                  {selectedSite && <p className="text-xs text-muted-foreground">{getSiteName(m.siteId)}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(m)} className="btn-outline text-xs px-3 py-1.5"><HiOutlinePencilAlt className="w-3.5 h-3.5 mr-1 inline" />Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="btn-danger text-xs px-3 py-1.5"><HiOutlineTrash className="w-3.5 h-3.5 mr-1 inline" />Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
