import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineSearch, HiOutlineExternalLink } from "react-icons/hi";

const STATUSES = ["active", "delayed", "completed"];

const STATUS_STYLE = {
  active: "badge-success",
  delayed: "badge-warning",
  completed: "badge-primary",
};

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    locationName: "",
    budget: "",
    startDate: "",
    targetEndDate: "",
    status: "active",
    progress: 0,
    assignedTo: "",
  });

  useEffect(() => { fetchSites(); }, []);

  async function fetchSites() {
    try {
      
      
      const res = await authFetch("/api/sites");
      if (res.ok) setSites(await res.json());
    } catch { toast.error("Failed to fetch sites");
      console.log(res);
     }
    finally { setLoading(false); }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" || name === "progress" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingSite ? "PUT" : "POST";
      const body = editingSite ? { ...formData, id: editingSite.id } : formData;
      const res = await authFetch("/api/sites", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingSite ? "Site updated!" : "Site created!");
        setShowForm(false); setEditingSite(null); resetForm(); fetchSites();
      } else { toast.error("Failed to save site"); }
    } catch { toast.error("Error saving site"); }
  }

  function resetForm() {
    setFormData({ name: "", clientName: "", locationName: "", budget: "", startDate: "", targetEndDate: "", status: "active", progress: 0, assignedTo: "" });
  }

  function handleEdit(site) {
    setEditingSite(site);
    setFormData({
      name: site.name || "", clientName: site.clientName || "", locationName: site.locationName || "",
      budget: site.budget || "", startDate: site.startDate || "", targetEndDate: site.targetEndDate || "",
      status: site.status || "active", progress: site.progress || 0, assignedTo: site.assignedTo || "",
    });
    setShowForm(true);
  }

  const formatETB = (amount) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);

  const filtered = sites.filter((s) =>
    search ? s.name?.toLowerCase().includes(search.toLowerCase()) || s.clientName?.toLowerCase().includes(search.toLowerCase()) : true
  );
 

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Construction Sites</h1>
          <button onClick={() => { setShowForm(true); setEditingSite(null); resetForm(); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Site
          </button>
             </div>

        <div className="card p-3 flex items-center gap-3">
          <HiOutlineSearch className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} className="input border-0 shadow-none focus:ring-0" />
        </div>

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editingSite ? "Edit Site" : "New Site"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input name="clientName" value={formData.clientName} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input name="locationName" value={formData.locationName} onChange={handleChange} required className="input" placeholder="e.g. Bole, Addis Ababa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (ETB)</label>
                <input type="number" name="budget" value={formData.budget} onChange={handleChange} required min="0" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target End Date</label>
                <input type="date" name="targetEndDate" value={formData.targetEndDate} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                <input type="number" name="progress" value={formData.progress} onChange={handleChange} min="0" max="100" className="input" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">{editingSite ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingSite(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((site) => (
              <div key={site.id} className="card card-hover p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{site.name}</h3>
                  <span className={`badge ${STATUS_STYLE[site.status] || "badge-primary"}`}>{site.status}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Client: {site.clientName}</p>
                <p className="text-sm text-muted-foreground mb-3">Location: {site.locationName}</p>
                <p className="text-sm font-medium text-gray-900 mb-2">{formatETB(site.budget || 0)}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${site.progress || 0}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{site.progress || 0}% complete</p>
                <div className="flex gap-2">
                  <a href={`/site/${site.id}`} className="btn-primary text-xs flex-1 text-center">
                    <HiOutlineExternalLink className="w-3.5 h-3.5 mr-1 inline" /> View
                  </a>
                  <button onClick={() => handleEdit(site)} className="btn-outline text-xs flex-1">
                    <HiOutlinePencilAlt className="w-3.5 h-3.5 mr-1 inline" /> Edit
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full card p-12 text-center">
                <p className="text-muted-foreground">No sites found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
