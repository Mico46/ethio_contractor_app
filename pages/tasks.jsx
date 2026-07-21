import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineFilter,
} from "react-icons/hi";

// Flutter SiteTask model: { id, siteId, title, assignedTo, dueDate, priority, status, syncStatus }

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["pending", "in_progress", "completed", "blocked"];

const PRIORITY_STYLE = { low: "badge-info", medium: "badge-primary", high: "badge-warning", urgent: "badge-danger" };
const STATUS_STYLE = { pending: "badge-warning", in_progress: "badge-primary", completed: "badge-success", blocked: "badge-danger" };
const STATUS_ICON = { pending: HiOutlineClock, in_progress: HiOutlineExclamationCircle, completed: HiOutlineCheckCircle, blocked: HiOutlineExclamationCircle };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [sites, setSites] = useState([]);
  const[users,setUsers]=useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [formData, setFormData] = useState({
    siteId: "",
    title: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });

  useEffect(() => {
    Promise.all([fetchTasks(), fetchSites(),fetchUsers()]);
  }, []);

  async function fetchTasks() {
    try {
      const res = await authFetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch { toast.error("Failed to fetch tasks"); }
    finally { setLoading(false); }
  }

  async function fetchSites() {
    try {
      const res = await authFetch("/api/sites");
      if (res.ok) setSites(await res.json());
    } catch { /* ignore */ }
  }
  async function fetchUsers(){
    try{
      const res=await authFetch("/api/users");
      if(res.ok) setUsers(await res.json());
    }catch{/*ignore*/}
  }

  function handleChange(e) { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingTask ? "PUT" : "POST";
      const body = editingTask ? { ...formData, id: editingTask.id } : formData;
      const res = await authFetch("/api/tasks", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingTask ? "Task updated!" : "Task created!");
        setShowForm(false); setEditingTask(null); resetForm(); fetchTasks();
      } else { toast.error("Failed to save task"); }
    } catch { toast.error("Error saving task"); }
  }

  function resetForm() {
    setFormData({ siteId: "", title: "", assignedTo: "", priority: "medium", status: "pending", dueDate: "" });
  }

  function handleEdit(task) {
    setEditingTask(task);
    setFormData({
      siteId: task.siteId || "", title: task.title || "", assignedTo: task.assignedTo || "",
      priority: task.priority || "medium", status: task.status || "pending", dueDate: task.dueDate || "",
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await authFetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success("Task deleted!"); fetchTasks(); }
    } catch { toast.error("Error deleting"); }
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const getSiteName = (siteId) => sites.find((s) => s.id === siteId)?.name || siteId;
  const getUserName = (userId) => users.find((u) => u.id === userId)?.name || userId;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tasks</h1>
          <button onClick={() => { setShowForm(true); setEditingTask(null); resetForm(); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> New Task
          </button>
        </div>

        <div className="card p-3 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HiOutlineFilter className="w-4 h-4" /> Filter:
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-auto">
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input w-auto">
            <option value="all">All Priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editingTask ? "Edit Task" : "New Task"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={formData.title} onChange={handleChange} required className="input" placeholder="Task title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select name="siteId" value={formData.siteId} onChange={handleChange} className="input">
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="input" placeholder="Worker name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="input">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input" />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-primary">{editingTask ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingTask(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-muted-foreground">No tasks found.</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const StatusIcon = STATUS_ICON[task.status] || HiOutlineClock;
              return (
                <div key={task.id} className="card card-hover p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <span className={`badge ${PRIORITY_STYLE[task.priority] || "badge-primary"}`}>{task.priority}</span>
                        <span className={`badge ${STATUS_STYLE[task.status] || "badge-primary"}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />{task.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {task.siteId && <span>Site: {getSiteName(task.siteId)}</span>}
                        {task.assignedTo && <span>Assigned: {getUserName(task.assignedTo)}</span>}
                        {task.dueDate && <span>Due: {task.dueDate}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <button onClick={() => handleEdit(task)} className="btn-outline text-xs px-3 py-1.5">
                        <HiOutlinePencilAlt className="w-3.5 h-3.5 mr-1 inline" /> Edit
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="btn-danger text-xs px-3 py-1.5">
                        <HiOutlineTrash className="w-3.5 h-3.5 mr-1 inline" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
