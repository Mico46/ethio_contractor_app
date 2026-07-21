import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineCalendar,
} from "react-icons/hi";

// Flutter DailyLog model: { id, siteId, date, workDone, workerCount, weather, issues, nextPlan, syncStatus }

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchSite, setSearchSite] = useState("");
  const [formData, setFormData] = useState({
    siteId: "",
    date: "",
    workDone: "",
    workerCount: "",
    weather: "",
    issues: "",
    nextPlan: "",
  });

  useEffect(() => {
    Promise.all([fetchLogs(), fetchSites()]);
  }, []);

  async function fetchLogs() {
    try {
      const res = await authFetch("/api/logs");
      if (res.ok) setLogs(await res.json());
    } catch { toast.error("Failed to fetch logs"); }
    finally { setLoading(false); }
  }

  async function fetchSites() {
    try {
      const res = await authFetch("/api/sites");
      if (res.ok) setSites(await res.json());
    } catch { /* ignore */ }
  }

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { ...formData, id: editing.id, workerCount: Number(formData.workerCount) || 0 }
        : { ...formData, workerCount: Number(formData.workerCount) || 0 };
      const res = await authFetch("/api/logs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editing ? "Log updated!" : "Log added!");
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchLogs();
      } else {
        toast.error("Failed to save log");
      }
    } catch {
      toast.error("Error saving log");
    }
  }

  function resetForm() {
    setFormData({ siteId: "", date: "", workDone: "", workerCount: "", weather: "", issues: "", nextPlan: "" });
  }

  function handleEdit(log) {
    setEditing(log);
    setFormData({
      siteId: log.siteId || "",
      date: log.date || "",
      workDone: log.workDone || "",
      workerCount: log.workerCount || "",
      weather: log.weather || "",
      issues: log.issues || "",
      nextPlan: log.nextPlan || "",
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this log entry?")) return;
    try {
      const res = await authFetch("/api/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { toast.success("Deleted!"); fetchLogs(); }
    } catch { toast.error("Error deleting"); }
  }

  const filtered = logs.filter((l) =>
    searchSite ? l.siteId?.toLowerCase().includes(searchSite.toLowerCase()) : true
  );

  const getSiteName = (siteId) => sites.find((s) => s.id === siteId)?.name || siteId;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daily Logs</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> New Log Entry
          </button>
        </div>

        <div className="card p-3 flex items-center gap-3">
          <HiOutlineSearch className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by site..." value={searchSite} onChange={(e) => setSearchSite(e.target.value)} className="input border-0 shadow-none focus:ring-0" />
        </div>

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Log" : "New Log Entry"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select name="siteId" value={formData.siteId} onChange={handleChange} required className="input">
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worker Count</label>
                <input type="number" name="workerCount" value={formData.workerCount} onChange={handleChange} min="0" className="input" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                <input name="weather" value={formData.weather} onChange={handleChange} className="input" placeholder="e.g. Sunny, 28C" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Done</label>
                <textarea name="workDone" value={formData.workDone} onChange={handleChange} rows={3} className="input" placeholder="Describe work completed today..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Issues / Problems</label>
                <textarea name="issues" value={formData.issues} onChange={handleChange} rows={2} className="input" placeholder="Any issues encountered..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Day Plan</label>
                <textarea name="nextPlan" value={formData.nextPlan} onChange={handleChange} rows={2} className="input" placeholder="What's planned for tomorrow..." />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">{editing ? "Update" : "Save Log"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineDocumentText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No log entries found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log.id} className="card card-hover p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge badge-primary">{getSiteName(log.siteId)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HiOutlineCalendar className="w-3 h-3" />
                        {log.date || "No date"}
                      </span>
                    </div>
                    {log.workDone && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Work Done</p>
                        <p className="text-sm text-gray-700">{log.workDone}</p>
                      </div>
                    )}
                    {log.issues && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-warning uppercase">Issues</p>
                        <p className="text-sm text-gray-700">{log.issues}</p>
                      </div>
                    )}
                    {log.nextPlan && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-info uppercase">Next Plan</p>
                        <p className="text-sm text-gray-700">{log.nextPlan}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                      {log.workerCount > 0 && <span>Workers: {log.workerCount}</span>}
                      {log.weather && <span>Weather: {log.weather}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <button onClick={() => handleEdit(log)} className="btn-outline text-xs px-3 py-1.5">
                      <HiOutlinePencilAlt className="w-3.5 h-3.5 mr-1 inline" /> Edit
                    </button>
                    <button onClick={() => handleDelete(log.id)} className="btn-danger text-xs px-3 py-1.5">
                      <HiOutlineTrash className="w-3.5 h-3.5 mr-1 inline" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
