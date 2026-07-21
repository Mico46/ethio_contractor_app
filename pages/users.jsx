import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineSearch } from "react-icons/hi";

const ROLES = ["admin", "site supervisor", "foreman", "worker", "not assigned"];

const ROLE_STYLE = {
  admin: "badge-accent",
  "site supervisor": "badge-primary",
  foreman: "badge-info",
  worker: "badge-success",
  "not assigned": "badge-warning",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "worker", assignedSite: "" });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await authFetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch { toast.error("Failed to fetch users"); }
    finally { setLoading(false); }
  }

  function handleChange(e) { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser ? { ...formData, id: editingUser.id } : formData;
      const res = await authFetch("/api/users", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingUser ? "User updated!" : "User created!");
        setShowForm(false); setEditingUser(null); setFormData({ name: "", email: "", phone: "", role: "worker", assignedSite: "" }); fetchUsers();
      } else { toast.error("Failed to save user"); }
    } catch { toast.error("Error saving user"); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await authFetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success("User deleted!"); fetchUsers(); }
    } catch { toast.error("Error deleting user"); }
  }

  function handleEdit(user) {
    setEditingUser(user);
    setFormData({ name: user.name || "", email: user.email || "", phone: user.phone || "", role: user.role || "worker", assignedSite: user.assignedSite || "" });
    setShowForm(true);
  }

  const filtered = users.filter((u) =>
    search ? u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">HR & Staff</h1>
          <button onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ name: "", email: "", phone: "", role: "worker", assignedSite: "" }); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        <div className="card p-3 flex items-center gap-3">
          <HiOutlineSearch className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="input border-0 shadow-none focus:ring-0" />
        </div>

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editingUser ? "Edit Staff" : "Add Staff"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251..." className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="input">
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">{editingUser ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3"><span className={`badge ${ROLE_STYLE[user.role] || "badge-primary"}`}>{user.role}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button onClick={() => handleEdit(user)} className="text-primary hover:text-primary-dark font-medium">Edit</button>
                        <button onClick={() => handleDelete(user.id)} className="text-danger hover:text-red-700 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">No staff found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((user) => (
                <div key={user.id} className="card card-hover p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`badge ${ROLE_STYLE[user.role] || "badge-primary"}`}>{user.role}</span>
                  </div>
                  {user.phone && <p className="text-xs text-muted-foreground mb-3">Phone: {user.phone}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(user)} className="btn-outline text-xs flex-1">Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="btn-danger text-xs flex-1">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
