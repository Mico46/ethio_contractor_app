import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph, HiOutlineSearch, HiOutlineX } from "react-icons/hi";

export const dynamic = "force-dynamic";

// Flutter SitePhoto model: { id, siteId, caption, takenAt, syncStatus, url (List<String>) }

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [searchSite, setSearchSite] = useState("");
  const [formData, setFormData] = useState({ siteId: "", caption: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { Promise.all([fetchPhotos(), fetchSites()]); }, []);

  async function fetchPhotos() {
    try { const res = await authFetch("/api/photos"); if (res.ok) setPhotos(await res.json()); }
    catch { toast.error("Failed to fetch photos"); } finally { setLoading(false); }
  }

  async function fetchSites() {
    try { const res = await authFetch("/api/sites"); if (res.ok) setSites(await res.json()); } catch { /* */ }
  }

  function handleChange(e) { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: formData.siteId,
          caption: formData.caption,
          url: urls,
          takenAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Photo added!");
        setShowForm(false);
        setFormData({ siteId: "", caption: "" });
        setFile(null);
        setPreview(null);
        fetchPhotos();
      } else { toast.error("Failed to add photo"); }
    } catch { toast.error("Error adding photo"); }
    finally { setUploading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this photo?")) return;
    try {
      const res = await authFetch("/api/photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success("Photo deleted!"); fetchPhotos(); }
    } catch { toast.error("Error deleting"); }
  }

  const filtered = photos.filter((p) =>
    searchSite ? p.siteId?.toLowerCase().includes(searchSite.toLowerCase()) || p.caption?.toLowerCase().includes(searchSite.toLowerCase()) : true
  );

  const getSiteName = (siteId) => sites.find((s) => s.id === siteId)?.name || siteId;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Photos</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Photo
          </button>
        </div>

        <div className="card p-3 flex items-center gap-3">
          <HiOutlineSearch className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by site or caption..." value={searchSite} onChange={(e) => setSearchSite(e.target.value)} className="input border-0 shadow-none focus:ring-0" />
        </div>

        {showForm && (
          <div className="card p-5 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Add Photo</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select name="siteId" value={formData.siteId} onChange={handleChange} required className="input">
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
              {preview && (
                <div className="sm:col-span-2">
                  <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input name="caption" value={formData.caption} onChange={handleChange} required className="input" placeholder="Describe this photo..." />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" disabled={uploading} className="btn-primary">{uploading ? "Uploading..." : "Upload"}</button>
                <button type="button" onClick={() => { setShowForm(false); setFile(null); setPreview(null); }} className="btn-outline">Cancel</button>
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
            <HiOutlinePhotograph className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No photos found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {filtered.map((photo) => {
              const thumbnail = photo.url && photo.url.length > 0 ? photo.url[0] : null;
              return (
                <div key={photo.id} className="card card-hover overflow-hidden cursor-pointer group" onClick={() => setLightbox(photo)}>
                  <div className="aspect-square bg-gray-100 relative">
                    {thumbnail ? (
                      <img src={thumbnail} alt={photo.caption} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlinePhotograph className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }} className="bg-red-600 text-white p-1.5 rounded-lg">
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{photo.caption}</p>
                    <p className="text-xs text-muted-foreground">{getSiteName(photo.siteId)}</p>
                    {photo.takenAt && <p className="text-xs text-muted-foreground">{new Date(photo.takenAt).toLocaleDateString("en-ET")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lightbox && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white hover:text-gray-300">
              <HiOutlineX className="w-8 h-8" />
            </button>
            <div className="max-w-3xl w-full bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {lightbox.url && lightbox.url.length > 0 && (
                <img src={lightbox.url[0]} alt={lightbox.caption} className="w-full max-h-[60vh] object-contain bg-gray-900" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{lightbox.caption}</h3>
                <p className="text-sm text-muted-foreground">{getSiteName(lightbox.siteId)}</p>
                {lightbox.takenAt && <p className="text-xs text-muted-foreground mt-1">{new Date(lightbox.takenAt).toLocaleDateString("en-ET")}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
