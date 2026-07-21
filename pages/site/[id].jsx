import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlineCollection, HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlinePhotograph, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamationCircle } from "react-icons/hi";

// Flutter models: Site, SiteTask, MaterialEntry, Expense, SitePhoto, DailyLog
const TABS = ["Overview", "Tasks", "Materials", "Expenses", "Photos", "Logs"];

export default function SiteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState("Overview");
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  async function fetchAll() {
    try {
      const [sitesRes, tasksRes, matsRes, expRes, photosRes, logsRes, usersRes] = await Promise.all([
        authFetch("/api/sites"), authFetch(`/api/tasks?siteId=${id}`), authFetch(`/api/materials?siteId=${id}`),
        authFetch(`/api/expenses?siteId=${id}`), authFetch(`/api/photos?siteId=${id}`),
        authFetch(`/api/logs?siteId=${id}`), authFetch("/api/users"),
      ]);
      if (sitesRes.ok) { const sites = await sitesRes.json(); setSite(sites.find((s) => s.id === id)); }
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (matsRes.ok) setMaterials(await matsRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch { toast.error("Failed to load site data"); }
    finally { setLoading(false); }
  }

  const formatETB = (a) => new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(a);
  const getUserName = (uid) => users.find((u) => u.id === uid)?.name || uid;

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    </DashboardLayout>
  );

  if (!site) return (
    <DashboardLayout>
      <div className="text-center py-16"><p className="text-muted-foreground">Site not found.</p></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/sites")} className="text-gray-500 hover:text-gray-700">
            <HiOutlineArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.clientName} - {site.locationName}</p>
          </div>
          <span className={`badge ${site.status === "active" ? "badge-success" : site.status === "delayed" ? "badge-warning" : "badge-primary"}`}>
            {site.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-border overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "Overview" && <OverviewTab site={site} expenses={expenses} tasks={tasks} materials={materials} formatETB={formatETB} getUserName={getUserName} />}
        {activeTab === "Tasks" && <TasksTab tasks={tasks} siteId={id} users={users} getUserName={getUserName} refresh={fetchAll} />}
        {activeTab === "Materials" && <MaterialsTab materials={materials} siteId={id} refresh={fetchAll} />}
        {activeTab === "Expenses" && <ExpensesTab expenses={expenses} siteId={id} refresh={fetchAll} formatETB={formatETB} />}
        {activeTab === "Photos" && <PhotosTab photos={photos} siteId={id} refresh={fetchAll} />}
        {activeTab === "Logs" && <LogsTab logs={logs} siteId={id} refresh={fetchAll} />}
      </div>
    </DashboardLayout>
  );
}

/* ========== OVERVIEW TAB ========== */
function OverviewTab({ site, expenses, tasks, materials, formatETB, getUserName }) {
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const budgetPct = site.budget > 0 ? Math.round((totalSpent / site.budget) * 100) : 0;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Budget</p>
          <p className="text-xl font-bold text-gray-900">{formatETB(site.budget || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Spent</p>
          <p className="text-xl font-bold text-danger">{formatETB(totalSpent)}</p>
          <p className="text-xs text-muted-foreground mt-1">{budgetPct}% of budget</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Progress</p>
          <p className="text-xl font-bold text-primary">{site.progress || 0}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Tasks</p>
          <p className="text-xl font-bold text-success">{completedTasks}/{tasks.length}</p>
        </div>
      </div>
      <div className="card p-4">
        <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Progress</p>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${site.progress || 0}%` }} />
        </div>
      </div>
      <div className="card p-4 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-muted-foreground">Start Date</p><p className="font-medium">{site.startDate || "-"}</p></div>
        <div><p className="text-muted-foreground">Target End</p><p className="font-medium">{site.targetEndDate || "-"}</p></div>
        <div><p className="text-muted-foreground">Assigned To</p><p className="font-medium">{site.assignedTo ? getUserName(site.assignedTo) : "Unassigned"}</p></div>
        <div><p className="text-muted-foreground">Location</p><p className="font-medium">{site.locationName}</p></div>
      </div>
    </div>
  );
}

/* ========== TASKS TAB ========== */
function TasksTab({ tasks, siteId, users, getUserName, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: "", assignedTo: "", priority: "medium", status: "pending", dueDate: "" });
  const PRIORITIES = ["low", "medium", "high", "urgent"];
  const STATUSES = ["pending", "in_progress", "completed", "blocked"];
  const PRIORITY_STYLE = { low: "badge-info", medium: "badge-primary", high: "badge-warning", urgent: "badge-danger" };
  const STATUS_STYLE = { pending: "badge-warning", in_progress: "badge-primary", completed: "badge-success", blocked: "badge-danger" };

  function handleChange(e) { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...formData, id: editing.id, siteId } : { ...formData, siteId };
    const res = await authFetch("/api/tasks", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? "Updated!" : "Created!"); setShowForm(false); setEditing(null); refresh(); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); refresh(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ title: "", assignedTo: "", priority: "medium", status: "pending", dueDate: "" }); }} className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePlus className="w-4 h-4" /> Add Task
        </button>
      </div>
      {showForm && (
        <div className="card p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><input name="title" value={formData.title} onChange={handleChange} required className="input" placeholder="Task title" /></div>
            <div>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="input">
                <option value="">Assign to...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><select name="priority" value={formData.priority} onChange={handleChange} className="input">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><select name="status" value={formData.status} onChange={handleChange} className="input">{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
            <div><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input" /></div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {tasks.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No tasks yet.</div> : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="card card-hover p-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{t.title}</span>
                  <span className={`badge ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                  <span className={`badge ${STATUS_STYLE[t.status]}`}>{t.status?.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.assignedTo && `Assigned: ${getUserName(t.assignedTo)}`} {t.dueDate && `- Due: ${t.dueDate}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(t); setFormData({ title: t.title, assignedTo: t.assignedTo || "", priority: t.priority, status: t.status, dueDate: t.dueDate || "" }); setShowForm(true); }} className="btn-outline text-xs px-2 py-1">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="btn-danger text-xs px-2 py-1">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== MATERIALS TAB (Stock Balance + Activity History) ========== */
function MaterialsTab({ materials, siteId, refresh }) {
  const [view, setView] = useState("stock"); // "stock" or "history"
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [incomingMaterials, setIncomingMaterials] = useState([]);
  const [formData, setFormData] = useState({ name: "", quantity: "", unit: "pcs", type: "Incoming", date: "" });
  const UNITS = ["kg", "tons", "m", "m2", "m3", "pcs", "bags", "rolls", "liters", "boxes"];

  useEffect(() => {
    setIncomingMaterials(materials.filter((m) => m.type === "Incoming"));
  }, [materials]);

  function handleChange(e) { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); }

  function handleNameSelect(e) {
    const selected = incomingMaterials.find((m) => m.name === e.target.value);
    if (selected) setFormData((p) => ({ ...p, name: selected.name, unit: selected.unit }));
    else setFormData((p) => ({ ...p, name: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...formData, id: editing.id, siteId, quantity: Number(formData.quantity) } : { ...formData, siteId, quantity: Number(formData.quantity) };
    const res = await authFetch("/api/materials", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); setEditing(null); refresh(); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/materials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); refresh(); }
  }

  // Stock balance calculation (matching Flutter)
  const stockMap = {};
  materials.forEach((m) => {
    const key = `${(m.name || "").toLowerCase()}|${(m.unit || "").toLowerCase()}`;
    if (!stockMap[key]) stockMap[key] = { name: m.name, unit: m.unit, incoming: 0, used: 0 };
    const qty = Number(m.quantity) || 0;
    if (m.type === "Incoming") stockMap[key].incoming += qty;
    else stockMap[key].used += qty;
  });
  const stockItems = Object.values(stockMap);

  // Activity history (sorted by date desc)
  const history = [...materials].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView("stock")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "stock" ? "bg-white shadow text-primary" : "text-muted-foreground"}`}>Stock Balance</button>
          <button onClick={() => setView("history")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "history" ? "bg-white shadow text-primary" : "text-muted-foreground"}`}>Activity History</button>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: "", quantity: "", unit: "pcs", type: "Incoming", date: "" }); }} className="btn-primary text-sm flex items-center gap-1">
          <HiOutlinePlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="input">
                <option value="Incoming">Incoming</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              {formData.type === "Used" && incomingMaterials.length > 0 ? (
                <select value={formData.name} onChange={handleNameSelect} className="input">
                  <option value="">Select material</option>
                  {[...new Set(incomingMaterials.map((m) => m.name))].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <input name="name" value={formData.name} onChange={handleChange} required className="input" placeholder="Material name" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" step="0.01" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="input">{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? "Update" : "Add"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Balance View */}
      {view === "stock" && (
        stockItems.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No materials recorded.</div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stockItems.map((item) => {
            const balance = item.incoming - item.used;
            const ratio = item.incoming > 0 ? item.used / item.incoming : 0;
            const status = balance <= 0 ? "depleted" : ratio > 0.8 ? "low" : "in_stock";
            const s = { depleted: { color: "text-danger", bg: "bg-red-50", bar: "bg-danger", label: "Depleted", badge: "badge-danger" },
              low: { color: "text-warning", bg: "bg-amber-50", bar: "bg-warning", label: "Low Stock", badge: "badge-warning" },
              in_stock: { color: "text-success", bg: "bg-green-50", bar: "bg-success", label: "In Stock", badge: "badge-success" } }[status];
            return (
              <div key={`${item.name}-${item.unit}`} className={`rounded-lg border p-4 ${s.bg}`}>
                <div className="flex justify-between items-start mb-2">
                  <div><p className="font-semibold text-gray-900">{item.name}</p><p className="text-xs text-muted-foreground">{item.unit}</p></div>
                  <span className={`badge ${s.badge}`}>{s.label}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>In: <strong>{item.incoming}</strong></span>
                  <span>Out: <strong>{item.used}</strong></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1"><div className={`${s.bar} h-2 rounded-full`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
                <p className={`text-sm font-bold ${s.color}`}>Balance: {balance} {item.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity History View */}
      {view === "history" && (
        history.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No activity yet.</div> :
        <div className="space-y-2">
          {history.map((m) => (
            <div key={m.id} className="card card-hover p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === "Incoming" ? "bg-green-100 text-success" : "bg-orange-100 text-warning"}`}>
                <span className="text-sm font-bold">{m.type === "Incoming" ? "+" : "-"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.name} - {m.quantity} {m.unit}</p>
                <p className="text-xs text-muted-foreground">{m.date || "No date"}</p>
              </div>
              <span className={`badge ${m.type === "Incoming" ? "badge-success" : "badge-warning"}`}>{m.type}</span>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(m); setFormData({ name: m.name, quantity: String(m.quantity), unit: m.unit, type: m.type, date: m.date || "" }); setShowForm(true); }} className="text-primary text-xs">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="text-danger text-xs ml-1">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== EXPENSES TAB ========== */
function ExpensesTab({ expenses, siteId, refresh, formatETB }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ category: "", amount: "", note: "", date: "" });
  const CATEGORIES = ["labor", "material", "equipment", "transport", "permits", "utilities", "other"];

  function handleChange(e) { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...formData, id: editing.id, siteId, amount: Number(formData.amount) } : { ...formData, siteId, amount: Number(formData.amount) };
    const res = await authFetch("/api/expenses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); setEditing(null); refresh(); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/expenses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); refresh(); }
  }

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: <strong className="text-gray-900">{formatETB(total)}</strong></p>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ category: "", amount: "", note: "", date: "" }); }} className="btn-primary text-sm flex items-center gap-1">
          <HiOutlinePlus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="card p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required className="input">
                <option value="">Select</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (ETB)</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
              <input name="note" value={formData.note} onChange={handleChange} className="input" placeholder="Description" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? "Update" : "Add"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {expenses.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No expenses yet.</div> : (
        <div className="space-y-2">
          {expenses.sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((e) => (
            <div key={e.id} className="card card-hover p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-primary">{e.category}</span>
                  <span className="font-semibold text-gray-900">{formatETB(e.amount || 0)}</span>
                </div>
                {e.note && <p className="text-sm text-muted-foreground mt-1">{e.note}</p>}
                <p className="text-xs text-muted-foreground">{e.date || ""}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(e); setFormData({ category: e.category, amount: String(e.amount), note: e.note || "", date: e.date || "" }); setShowForm(true); }} className="text-primary text-xs">Edit</button>
                <button onClick={() => handleDelete(e.id)} className="text-danger text-xs ml-1">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== PHOTOS TAB ========== */
function PhotosTab({ photos, siteId, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      let urls = [];
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await authFetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) { toast.error("Image upload failed"); setUploading(false); return; }
        const { url } = await uploadRes.json();
        urls = [url];
      }
      const res = await authFetch("/api/photos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, caption, url: urls, takenAt: new Date().toISOString() }),
      });
      if (res.ok) { toast.success("Added!"); setShowForm(false); setCaption(""); setFile(null); setPreview(null); refresh(); }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); refresh(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Add Photo</button>
      </div>
      {showForm && (
        <div className="card p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><input value={caption} onChange={(e) => setCaption(e.target.value)} required className="input" placeholder="Caption" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            {preview && <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />}
            <div className="flex gap-2">
              <button type="submit" disabled={uploading} className="btn-primary text-sm">{uploading ? "Uploading..." : "Add"}</button>
              <button type="button" onClick={() => { setShowForm(false); setFile(null); setPreview(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {photos.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No photos yet.</div> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => {
            const img = p.url && p.url.length > 0 ? p.url[0] : null;
            return (
              <div key={p.id} className="card card-hover overflow-hidden cursor-pointer group" onClick={() => setLightbox(p)}>
                <div className="aspect-square bg-gray-100 relative">
                  {img ? <img src={img} alt={p.caption} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><HiOutlinePhotograph className="w-8 h-8 text-gray-300" /></div>}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100"><HiOutlineTrash className="w-3 h-3" /></button>
                </div>
                <div className="p-2"><p className="text-xs font-medium truncate">{p.caption}</p><p className="text-xs text-muted-foreground">{p.takenAt ? new Date(p.takenAt).toLocaleDateString("en-ET") : ""}</p></div>
              </div>
            );
          })}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-3xl w-full bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {lightbox.url?.[0] && <img src={lightbox.url[0]} alt={lightbox.caption} className="w-full max-h-[60vh] object-contain bg-gray-900" />}
            <div className="p-4"><p className="font-semibold">{lightbox.caption}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== LOGS TAB ========== */
function LogsTab({ logs, siteId, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ date: "", workDone: "", workerCount: "", weather: "", issues: "", nextPlan: "" });

  function handleChange(e) { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...formData, id: editing.id, siteId, workerCount: Number(formData.workerCount) || 0 } : { ...formData, siteId, workerCount: Number(formData.workerCount) || 0 };
    const res = await authFetch("/api/logs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); setEditing(null); refresh(); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete?")) return;
    const res = await authFetch("/api/logs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success("Deleted!"); refresh(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ date: "", workDone: "", workerCount: "", weather: "", issues: "", nextPlan: "" }); }} className="btn-primary text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> New Log</button>
      </div>
      {showForm && (
        <div className="card p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="input" /></div>
            <div><label className="text-xs font-medium">Workers</label><input type="number" name="workerCount" value={formData.workerCount} onChange={handleChange} min="0" className="input" placeholder="0" /></div>
            <div><label className="text-xs font-medium">Weather</label><input name="weather" value={formData.weather} onChange={handleChange} className="input" placeholder="Sunny, 28C" /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Work Done</label><textarea name="workDone" value={formData.workDone} onChange={handleChange} rows={2} className="input" /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Issues</label><textarea name="issues" value={formData.issues} onChange={handleChange} rows={2} className="input" /></div>
            <div className="col-span-2"><label className="text-xs font-medium">Next Plan</label><textarea name="nextPlan" value={formData.nextPlan} onChange={handleChange} rows={2} className="input" /></div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? "Update" : "Save"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {logs.length === 0 ? <div className="card p-8 text-center text-muted-foreground">No logs yet.</div> : (
        <div className="space-y-2">
          {logs.sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((l) => (
            <div key={l.id} className="card card-hover p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-primary">{l.date || "No date"}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(l); setFormData({ date: l.date || "", workDone: l.workDone || "", workerCount: String(l.workerCount || ""), weather: l.weather || "", issues: l.issues || "", nextPlan: l.nextPlan || "" }); setShowForm(true); }} className="text-primary text-xs">Edit</button>
                  <button onClick={() => handleDelete(l.id)} className="text-danger text-xs ml-1">Del</button>
                </div>
              </div>
              {l.workDone && <div className="mb-1"><p className="text-xs font-medium text-muted-foreground">Work Done</p><p className="text-sm">{l.workDone}</p></div>}
              {l.issues && <div className="mb-1"><p className="text-xs font-medium text-warning">Issues</p><p className="text-sm">{l.issues}</p></div>}
              {l.nextPlan && <div className="mb-1"><p className="text-xs font-medium text-info">Next Plan</p><p className="text-sm">{l.nextPlan}</p></div>}
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                {l.workerCount > 0 && <span>Workers: {l.workerCount}</span>}
                {l.weather && <span>Weather: {l.weather}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
