import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import {
  HiOutlineCalculator,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineTable,
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineX,
} from "react-icons/hi";

const CATEGORIES = [
  "Substructure",
  "Concrete Work",
  "Masonry Work",
  "Finishes",
  "Structural Steel",
  "Earthworks & Site Prep",
  "Roofing & Waterproofing",
  "Mechanical & Electrical (MEP)",
];

const UNITS = ["m³", "m²", "m", "Ton", "Pcs", "L.S."];

export default function BOQPage() {
  const [activeTab, setActiveTab] = useState("calculator"); // "calculator", "summary", "rates"
  const [sites, setSites] = useState([]);
  const [boqItems, setBoqItems] = useState([]);
  const [unitRates, setUnitRates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // BOQ Item Edit state
  const [editingBoqItem, setEditingBoqItem] = useState(null);

  // Calculator Form State
  const [formData, setFormData] = useState({
    itemNo: "1.1",
    category: CATEGORIES[0],
    description: "",
    unit: "m³",
    length: "",
    width: "",
    height: "",
    noOfMembers: "1",
    quantity: "",
    rate: "",
    wastageFactor: "5.0",
  });

  // Unit Rate Modal / Form state
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [rateForm, setRateForm] = useState({
    category: CATEGORIES[0],
    itemDescription: "",
    unit: "m³",
    standardRate: "",
    defaultWastageFactor: "5.0",
  });

  useEffect(() => {
    fetchData();
  }, [selectedSiteId]);

  async function fetchData() {
    try {
      const [sitesRes, boqRes, ratesRes] = await Promise.all([
        authFetch("/api/sites"),
        authFetch(`/api/boq?siteId=${selectedSiteId}`),
        authFetch("/api/unit-rates"),
      ]);

      if (sitesRes.ok) {
        const sData = await sitesRes.json();
        setSites(sData);
      }
      if (boqRes.ok) {
        setBoqItems(await boqRes.json());
      }
      if (ratesRes.ok) {
        setUnitRates(await ratesRes.json());
      }
    } catch {
      toast.error("Failed to load BOQ data");
    } finally {
      setLoading(false);
    }
  }

  const formatETB = (amount) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount || 0);

  // Calculations
  const calcUnitQty = () => {
    const l = parseFloat(formData.length) || 0;
    const w = parseFloat(formData.width) || 0;
    const h = parseFloat(formData.height) || 0;
    const q = parseFloat(formData.quantity) || 0;

    if (formData.unit === "m³") return l * w * h;
    if (formData.unit === "m²") return l * w;
    if (formData.unit === "m") return l;
    return q;
  };

  const members = parseFloat(formData.noOfMembers) || 1.0;
  const unitQty = calcUnitQty();
  const netQty = unitQty * (members > 0 ? members : 1.0);
  const wastage = parseFloat(formData.wastageFactor) || 0;
  const grossQty = netQty * (1 + wastage / 100.0);
  const rateVal = parseFloat(formData.rate) || 0;
  const netAmount = netQty * rateVal;
  const grossAmount = grossQty * rateVal;
  const wastageAmount = grossAmount - netAmount;

  // Auto-fill from Standard Unit Rate
  function applyStandardRate(rate) {
    setFormData((p) => ({
      ...p,
      category: rate.category,
      description: rate.itemDescription,
      unit: rate.unit,
      rate: rate.standardRate.toString(),
      wastageFactor: (rate.defaultWastageFactor || 5.0).toString(),
    }));
    toast.success(`Applied rate for: ${rate.itemDescription}`);
    setActiveTab("calculator");
  }

  // Start editing a BOQ item
  function handleEditBoqClick(item) {
    setEditingBoqItem(item);
    setFormData({
      itemNo: item.itemNo || "1.1",
      category: item.category || CATEGORIES[0],
      description: item.description || "",
      unit: item.unit || "m³",
      length: item.length !== null && item.length !== undefined ? item.length.toString() : "",
      width: item.width !== null && item.width !== undefined ? item.width.toString() : "",
      height: item.height !== null && item.height !== undefined ? item.height.toString() : "",
      noOfMembers: (item.noOfMembers || 1).toString(),
      quantity: (item.quantity || "").toString(),
      rate: (item.rate || "").toString(),
      wastageFactor: (item.wastageFactor || 5.0).toString(),
    });
    setActiveTab("calculator");
  }

  function cancelBoqEdit() {
    setEditingBoqItem(null);
    setFormData({
      itemNo: "1.1",
      category: CATEGORIES[0],
      description: "",
      unit: "m³",
      length: "",
      width: "",
      height: "",
      noOfMembers: "1",
      quantity: "",
      rate: "",
      wastageFactor: "5.0",
    });
  }

  // Handle BOQ Item submit (Create or Update)
  async function handleSubmitBoq(e) {
    e.preventDefault();
    const targetSiteId =
      selectedSiteId === "all" ? (sites.length > 0 ? sites[0].id : "site-1") : selectedSiteId;

    const nextNo = `${boqItems.length + 1}.${boqItems.length + 1}`;

    const payload = {
      itemNo: formData.itemNo || nextNo,
      category: formData.category,
      description: formData.description,
      unit: formData.unit,
      length: formData.length !== "" ? parseFloat(formData.length) : null,
      width: formData.width !== "" ? parseFloat(formData.width) : null,
      height: formData.height !== "" ? parseFloat(formData.height) : null,
      noOfMembers: parseFloat(formData.noOfMembers) || 1.0,
      quantity: netQty > 0 ? netQty : parseFloat(formData.quantity) || 0,
      rate: rateVal,
      wastageFactor: wastage,
      siteId: targetSiteId,
    };

    try {
      const isEdit = !!editingBoqItem;
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { id: editingBoqItem.id, ...payload } : payload;

      const res = await authFetch("/api/boq", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEdit ? "BOQ item updated!" : "BOQ item added successfully!");
        cancelBoqEdit();
        fetchData();
        setActiveTab("summary");
      } else {
        toast.error(isEdit ? "Failed to update item" : "Failed to add BOQ item");
      }
    } catch {
      toast.error("Error saving BOQ item");
    }
  }

  // Delete BOQ Item
  async function handleDeleteBoq(id) {
    if (!confirm("Delete this BOQ item?")) return;
    try {
      const res = await authFetch("/api/boq", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Deleted");
        fetchData();
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  // Start editing standard unit rate
  function handleEditRateClick(rate) {
    setEditingRate(rate);
    setRateForm({
      category: rate.category || CATEGORIES[0],
      itemDescription: rate.itemDescription || "",
      unit: rate.unit || "m³",
      standardRate: (rate.standardRate || "").toString(),
      defaultWastageFactor: (rate.defaultWastageFactor || 5.0).toString(),
    });
    setShowRateForm(true);
  }

  function cancelRateEdit() {
    setEditingRate(null);
    setShowRateForm(false);
    setRateForm({
      category: CATEGORIES[0],
      itemDescription: "",
      unit: "m³",
      standardRate: "",
      defaultWastageFactor: "5.0",
    });
  }

  // Save Unit Rate (Create or Update)
  async function handleSaveUnitRate(e) {
    e.preventDefault();
    try {
      const isEdit = !!editingRate;
      const method = isEdit ? "PUT" : "POST";
      const body = {
        ...(isEdit && { id: editingRate.id }),
        category: rateForm.category,
        itemDescription: rateForm.itemDescription,
        unit: rateForm.unit,
        standardRate: parseFloat(rateForm.standardRate) || 0,
        defaultWastageFactor: parseFloat(rateForm.defaultWastageFactor) || 5.0,
      };

      const res = await authFetch("/api/unit-rates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEdit ? "Unit rate updated!" : "Standard unit rate added!");
        cancelRateEdit();
        fetchData();
      }
    } catch {
      toast.error("Failed to save unit rate");
    }
  }

  // Delete Unit Rate
  async function handleDeleteRate(id) {
    if (!confirm("Delete this standard unit rate?")) return;
    try {
      const res = await authFetch("/api/unit-rates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Unit rate deleted!");
        fetchData();
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  // Group items by category for Summary
  const groupedSections = {};
  boqItems.forEach((item) => {
    const cat = item.category || "Uncategorized";
    if (!groupedSections[cat]) groupedSections[cat] = [];
    groupedSections[cat].push(item);
  });

  const grandTotalNet = boqItems.reduce((sum, i) => sum + (i.quantity || 0) * (i.rate || 0), 0);
  const grandTotalGross = boqItems.reduce((sum, i) => {
    const q = i.quantity || 0;
    const w = i.wastageFactor || 0;
    const gross = q * (1 + w / 100);
    return sum + gross * (i.rate || 0);
  }, 0);
  const grandTotalWastage = grandTotalGross - grandTotalNet;

  const filteredRates = unitRates.filter(
    (r) =>
      r.itemDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Site Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-950">
              Bill of Quantities (BOQ) & Unit Rates
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Construction estimation, net/gross quantities, wastage factors & standard unit rate table.
            </p>
          </div>
          <div>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="input bg-white font-medium shadow-sm"
            >
              <option value="all">All Sites Combined</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "calculator"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-gray-900"
            }`}
          >
            <HiOutlineCalculator className="w-4 h-4" />{" "}
            {editingBoqItem ? "Edit BOQ Item" : "BOQ Estimator & Calculator"}
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-gray-900"
            }`}
          >
            <HiOutlineClipboardList className="w-4 h-4" /> BOQ Summary Table ({boqItems.length})
          </button>
          <button
            onClick={() => setActiveTab("rates")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "rates"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-gray-900"
            }`}
          >
            <HiOutlineTable className="w-4 h-4" /> Standard Unit Rate Table ({unitRates.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* ================= 1. CALCULATOR TAB ================= */}
            {activeTab === "calculator" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <HiOutlineCalculator className="w-5 h-5 text-primary" />
                      {editingBoqItem ? `Editing Item #${editingBoqItem.itemNo}` : "Add BOQ Item & Calculate"}
                    </h2>
                    {editingBoqItem && (
                      <button
                        onClick={cancelBoqEdit}
                        className="btn-outline text-xs px-2.5 py-1 text-danger border-danger hover:bg-danger hover:text-white"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmitBoq} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="input"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Unit of Measurement
                        </label>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="input"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Item Description
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Reinforced Concrete Footing C25/30"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input"
                      />
                    </div>

                    {/* Dimensions / Qty */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-border space-y-3">
                      <p className="text-xs font-bold text-gray-700 uppercase">
                        Dimension Builder ({formData.unit})
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Length (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.length}
                            onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Width (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.width}
                            onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Height (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">No. Members</label>
                          <input
                            type="number"
                            step="1"
                            value={formData.noOfMembers}
                            onChange={(e) => setFormData({ ...formData, noOfMembers: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                      </div>
                      {formData.unit === "Pcs" || formData.unit === "L.S." || formData.unit === "Ton" ? (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            Direct Quantity Override
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Direct Qty"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Unit Rate (ETB)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formData.rate}
                          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Wastage Factor (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.wastageFactor}
                          onChange={(e) => setFormData({ ...formData, wastageFactor: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button type="submit" className="btn-primary flex-1 py-3 font-bold text-base">
                        {editingBoqItem ? "Update BOQ Item" : "Save BOQ Item to Project Database"}
                      </button>
                      {editingBoqItem && (
                        <button
                          type="button"
                          onClick={cancelBoqEdit}
                          className="btn-outline px-5 py-3 font-semibold text-base"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Live Calculation Preview Card */}
                <div className="card p-6 bg-gradient-to-br from-emerald-900 to-teal-800 text-white space-y-5">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
                      Live Calculation Preview
                    </span>
                    <h3 className="text-xl font-bold mt-1">Estimation Summary</h3>
                  </div>

                  <div className="space-y-3 text-sm divide-y divide-emerald-700/50">
                    <div className="flex justify-between pt-2">
                      <span className="text-emerald-200">Net Quantity:</span>
                      <strong className="text-white text-base">
                        {netQty.toFixed(2)} {formData.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-emerald-200">Gross Qty (+{wastage}% waste):</span>
                      <strong className="text-amber-300 text-base">
                        {grossQty.toFixed(2)} {formData.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-emerald-200">Net Amount:</span>
                      <strong className="text-white text-base">{formatETB(netAmount)}</strong>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-emerald-200">Wastage Cost:</span>
                      <strong className="text-rose-300 text-base">{formatETB(wastageAmount)}</strong>
                    </div>
                    <div className="flex justify-between pt-3 text-lg font-extrabold border-t border-emerald-600">
                      <span>Gross Total:</span>
                      <span className="text-amber-300">{formatETB(grossAmount)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-700/50">
                    <p className="text-xs text-emerald-200 mb-2 font-semibold">
                      💡 Tip: Pick a standard rate from the Unit Rate Table to auto-fill description & pricing.
                    </p>
                    <button
                      onClick={() => setActiveTab("rates")}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors border border-white/20"
                    >
                      Browse Unit Rate Table →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. SUMMARY TABLE TAB ================= */}
            {activeTab === "summary" && (
              <div className="space-y-6">
                {/* Grand Totals Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-5">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Net BOQ Total</p>
                    <p className="text-2xl font-extrabold text-gray-900">{formatETB(grandTotalNet)}</p>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Wastage Cost Total</p>
                    <p className="text-2xl font-extrabold text-amber-600">{formatETB(grandTotalWastage)}</p>
                  </div>
                  <div className="card p-5 bg-primary/5 border-primary/20">
                    <p className="text-xs text-primary uppercase font-bold">Gross Total (Inc. Wastage)</p>
                    <p className="text-2xl font-extrabold text-primary">{formatETB(grandTotalGross)}</p>
                  </div>
                </div>

                {/* Categorized Sections */}
                {Object.keys(groupedSections).length === 0 ? (
                  <div className="card p-12 text-center text-muted-foreground">
                    No BOQ items recorded yet. Use the Estimator tab to add items.
                  </div>
                ) : (
                  Object.entries(groupedSections).map(([category, items]) => {
                    const catNet = items.reduce((s, i) => s + (i.quantity || 0) * (i.rate || 0), 0);
                    const catGross = items.reduce((s, i) => {
                      const q = i.quantity || 0;
                      const w = i.wastageFactor || 0;
                      return s + q * (1 + w / 100) * (i.rate || 0);
                    }, 0);

                    return (
                      <div key={category} className="card overflow-hidden">
                        <div className="px-5 py-3.5 bg-gray-50 border-b border-border flex justify-between items-center">
                          <h3 className="font-bold text-gray-900 text-base">{category}</h3>
                          <div className="text-sm space-x-4">
                            <span className="text-muted-foreground">
                              Net: <strong>{formatETB(catNet)}</strong>
                            </span>
                            <span className="text-primary">
                              Gross: <strong>{formatETB(catGross)}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100/50">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Net Qty</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Rate (ETB)</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Waste %</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Gross Amount</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {items.map((item) => {
                                const q = item.quantity || 0;
                                const w = item.wastageFactor || 0;
                                const gross = q * (1 + w / 100) * (item.rate || 0);
                                return (
                                  <tr key={item.id} className="hover:bg-gray-50/80">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{item.itemNo}</td>
                                    <td className="px-4 py-3 text-gray-800 max-w-xs">{item.description}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                                    <td className="px-4 py-3 text-right font-medium">{q.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{formatETB(item.rate)}</td>
                                    <td className="px-4 py-3 text-right text-amber-600 font-medium">{w}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">
                                      {formatETB(gross)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => handleEditBoqClick(item)}
                                          className="text-primary hover:text-emerald-800 p-1 rounded transition-colors"
                                          title="Edit Item"
                                        >
                                          <HiOutlinePencilAlt className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBoq(item.id)}
                                          className="text-danger hover:text-red-800 p-1 rounded transition-colors"
                                          title="Delete Item"
                                        >
                                          <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ================= 3. STANDARD UNIT RATE TABLE TAB ================= */}
            {activeTab === "rates" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="card p-2 flex items-center gap-2 flex-1 max-w-md">
                      <HiOutlineSearch className="w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search standard rates by description or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input border-0 shadow-none focus:ring-0 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRate(null);
                      setRateForm({
                        category: CATEGORIES[0],
                        itemDescription: "",
                        unit: "m³",
                        standardRate: "",
                        defaultWastageFactor: "5.0",
                      });
                      setShowRateForm(true);
                    }}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <HiOutlinePlus className="w-4 h-4" /> Add Standard Unit Rate
                  </button>
                </div>

                {/* Add / Edit Unit Rate Modal */}
                {showRateForm && (
                  <div className="card p-6 border-2 border-primary/30 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {editingRate ? "Edit Standard Unit Rate" : "Add New Standard Unit Rate"}
                      </h3>
                      <button
                        onClick={cancelRateEdit}
                        className="text-muted-foreground hover:text-gray-900 text-sm font-bold"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <form onSubmit={handleSaveUnitRate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Category
                        </label>
                        <select
                          value={rateForm.category}
                          onChange={(e) => setRateForm({ ...rateForm, category: e.target.value })}
                          className="input"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Unit
                        </label>
                        <select
                          value={rateForm.unit}
                          onChange={(e) => setRateForm({ ...rateForm, unit: e.target.value })}
                          className="input"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Item Description
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Reinforced Concrete C30/37"
                          value={rateForm.itemDescription}
                          onChange={(e) => setRateForm({ ...rateForm, itemDescription: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Standard Rate (ETB)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={rateForm.standardRate}
                          onChange={(e) => setRateForm({ ...rateForm, standardRate: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Default Wastage Factor (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={rateForm.defaultWastageFactor}
                          onChange={(e) =>
                            setRateForm({ ...rateForm, defaultWastageFactor: e.target.value })
                          }
                          className="input"
                        />
                      </div>
                      <div className="sm:col-span-2 flex gap-3 pt-2">
                        <button type="submit" className="btn-primary">
                          {editingRate ? "Update Unit Rate" : "Save Unit Rate"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelRateEdit}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Unit Rate Table */}
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Standard Unit Rate Catalog</h3>
                      <p className="text-xs text-muted-foreground">
                        Standardized Ethiopian construction material and labor unit rates. Click &quot;Use Rate&quot; to apply to estimator.
                      </p>
                    </div>
                    <span className="badge badge-primary">{filteredRates.length} Rates</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-100/60">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Standard Rate (ETB)</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Default Waste %</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRates.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-muted-foreground">
                              No matching unit rates found.
                            </td>
                          </tr>
                        ) : (
                          filteredRates.map((rate) => (
                            <tr key={rate.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="badge badge-primary">{rate.category}</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900 max-w-sm">
                                {rate.itemDescription}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{rate.unit}</td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {formatETB(rate.standardRate)}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-600 font-medium">
                                {rate.defaultWastageFactor}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => applyStandardRate(rate)}
                                    className="btn-outline text-xs px-2.5 py-1 font-semibold text-primary hover:bg-primary hover:text-white"
                                  >
                                    Use Rate →
                                  </button>
                                  <button
                                    onClick={() => handleEditRateClick(rate)}
                                    className="text-primary hover:text-emerald-800 p-1 rounded transition-colors"
                                    title="Edit Rate"
                                  >
                                    <HiOutlinePencilAlt className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRate(rate.id)}
                                    className="text-danger hover:text-red-800 p-1 rounded transition-colors"
                                    title="Delete Rate"
                                  >
                                    <HiOutlineTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
