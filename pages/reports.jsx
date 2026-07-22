import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";
import DashboardLayout from "@/components/dashboard-layout";
import toast from "react-hot-toast";
import {
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlinePrinter,
  HiOutlineCash,
  HiOutlineClipboardList,
  HiOutlineDatabase,
  HiOutlineCheckCircle,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";

export default function Reports() {
  const { user, profile } = useAuth();
  const userName = profile?.name || user?.name || "Supervisor";

  // Data
  const [sites, setSites] = useState([]);
  const [logs, setLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      const [sitesRes, logsRes, expRes, matsRes, tasksRes, usersRes] = await Promise.all([
        authFetch("/api/sites"),
        authFetch("/api/logs"),
        authFetch("/api/expenses"),
        authFetch("/api/materials"),
        authFetch("/api/tasks"),
        authFetch("/api/users"),
      ]);

      let sitesData = [];
      if (sitesRes.ok) {
        sitesData = await sitesRes.json();
        setSites(sitesData);
        if (sitesData.length > 0) {
          setSelectedSiteId(sitesData[0].id);
        }
      }
      if (logsRes.ok) setLogs(await logsRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
      if (matsRes.ok) setMaterials(await matsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }

  const formatETB = (amount) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount || 0);

  const getUserName = (uid) => users.find((u) => u.id === uid)?.name || uid || "Unassigned";

  // Selected site object
  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Date filtering logic (matching Flutter)
  const startDt = startDate ? new Date(startDate + "T00:00:00") : new Date(0);
  const endDt = endDate ? new Date(endDate + "T23:59:59") : new Date(8640000000000000);

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= startDt && d <= endDt;
  };

  const isDateBeforeEnd = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d <= endDt;
  };

  // Filtered dataset for selected site and range
  const siteLogs = logs.filter((l) => l.siteId === selectedSiteId && isDateInRange(l.date));
  const siteExpenses = expenses.filter((e) => e.siteId === selectedSiteId && isDateInRange(e.date));
  const siteMaterialsPeriod = materials.filter((m) => m.siteId === selectedSiteId && isDateInRange(m.date));
  const siteMaterialsAllUpToEnd = materials.filter((m) => m.siteId === selectedSiteId && isDateBeforeEnd(m.date));
  const siteTasks = tasks.filter((t) => t.siteId === selectedSiteId && isDateInRange(t.dueDate));

  // Material stock calculation (matching Flutter PdfReportGenerator.calculateStock)
  const stockMap = {};
  siteMaterialsAllUpToEnd.forEach((m) => {
    const key = `${(m.name || "").trim().toLowerCase()}_${(m.unit || "").trim().toLowerCase()}`;
    if (!stockMap[key]) {
      stockMap[key] = {
        name: m.name,
        unit: m.unit,
        totalIncoming: 0,
        totalUsed: 0,
        inStock: 0,
      };
    }
    const qty = Number(m.quantity) || 0;
    if ((m.type || "").toLowerCase() === "incoming") {
      stockMap[key].totalIncoming += qty;
    } else if ((m.type || "").toLowerCase() === "used") {
      stockMap[key].totalUsed += qty;
    }
    stockMap[key].inStock = stockMap[key].totalIncoming - stockMap[key].totalUsed;
  });
  const stockSummaries = Object.values(stockMap);

  const totalExpensesPeriod = siteExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const completedTasksCount = siteTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;

  // Print / PDF Export Handler matching Flutter PdfReportGenerator
  const handlePrintPdf = () => {
    if (!selectedSite) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to generate the PDF report");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Report_${selectedSite.name.replace(/\s+/g, "_")}_${startDate}_${endDate}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; margin: 0; padding: 0; font-size: 10pt; line-height: 1.4; }
    .header-banner { background-color: #256D5A; color: #ffffff; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header-banner h1 { margin: 0; font-size: 18pt; font-weight: bold; text-transform: uppercase; }
    .header-banner h2 { margin: 4px 0 0 0; font-size: 12pt; font-weight: normal; opacity: 0.95; }
    .header-banner .period { text-align: right; font-size: 10pt; }
    .grid-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-bottom: 20px; }
    .card { border: 1px solid #E5E7EB; border-radius: 6px; background-color: #F9FAFB; padding: 12px 16px; }
    .card-title { color: #256D5A; font-size: 11pt; font-weight: bold; margin-bottom: 8px; border-bottom: 1.5px solid #256D5A; padding-bottom: 4px; }
    .meta-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9.5pt; }
    .meta-row label { font-weight: bold; color: #374151; }
    .section-title { color: #256D5A; font-size: 11pt; font-weight: bold; margin: 24px 0 8px 0; border-bottom: 1.5px solid #256D5A; padding-bottom: 4px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5pt; }
    th, td { border: 1px solid #E5E7EB; padding: 6px 10px; text-align: left; }
    th { background-color: #F3F4F6; font-weight: bold; color: #1F2937; }
    tr:nth-child(even) { background-color: #FAFAFA; }
    .log-item { border: 1px solid #E5E7EB; border-radius: 4px; padding: 10px; margin-bottom: 10px; background-color: #FFFFFF; }
    .log-header { display: flex; justify-content: space-between; font-weight: bold; color: #256D5A; font-size: 10pt; margin-bottom: 6px; }
    .log-meta { font-size: 8.5pt; color: #6B7280; font-weight: normal; }
    .log-text { font-size: 9.5pt; margin-top: 4px; }
    .issues { color: #D97706; font-weight: bold; }
    .total-row { background-color: #F3F4F6; font-weight: bold; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 8pt; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 8px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <!-- Header Banner -->
  <div class="header-banner">
    <div>
      <h1>Project Activity Report</h1>
      <h2>Site: ${selectedSite.name}</h2>
    </div>
    <div class="period">
      <strong>Period:</strong><br/>
      ${startDate} to ${endDate}
    </div>
  </div>

  <!-- Site Metadata & Summary Statistics Row -->
  <div class="grid-2">
    <div class="card">
      <div class="card-title">SITE INFORMATION</div>
      <div class="meta-row"><label>Client Name:</label> <span>${selectedSite.clientName || "-"}</span></div>
      <div class="meta-row"><label>Location:</label> <span>${selectedSite.locationName || "-"}</span></div>
      <div class="meta-row"><label>Total Budget:</label> <span>${formatETB(selectedSite.budget)}</span></div>
      <div class="meta-row"><label>Status:</label> <span>${(selectedSite.status || "").toUpperCase()}</span></div>
      <div class="meta-row"><label>Progress:</label> <span>${selectedSite.progress || 0}%</span></div>
    </div>
    <div class="card">
      <div class="card-title">SUMMARY STATISTICS</div>
      <div class="meta-row"><label>Daily Logs:</label> <span>${siteLogs.length} logged</span></div>
      <div class="meta-row"><label>Expenses:</label> <span>${formatETB(totalExpensesPeriod)}</span></div>
      <div class="meta-row"><label>Materials:</label> <span>${siteMaterialsPeriod.length} entries</span></div>
      <div class="meta-row"><label>Tasks:</label> <span>${completedTasksCount}/${siteTasks.length} done</span></div>
    </div>
  </div>

  <!-- Daily Logs Section -->
  <div class="section-title">DAILY LOGS</div>
  ${
    siteLogs.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No daily logs recorded in this period.</p>'
      : siteLogs
          .map(
            (log) => `
    <div class="log-item">
      <div class="log-header">
        <span>${log.date || "-"}</span>
        <span class="log-meta">Weather: ${log.weather || "N/A"} | Workers: ${log.workerCount || 0}</span>
      </div>
      <div class="log-text"><strong>Work Done:</strong> ${log.workDone || "-"}</div>
      ${log.issues ? `<div class="log-text"><span class="issues">Issues:</span> ${log.issues}</div>` : ""}
      ${log.nextPlan ? `<div class="log-text"><strong>Next Day's Plan:</strong> ${log.nextPlan}</div>` : ""}
    </div>
  `
          )
          .join("")
  }

  <!-- Expenses Table -->
  <div class="section-title">PERIOD EXPENSES</div>
  ${
    siteExpenses.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No expenses recorded in this period.</p>'
      : `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description / Note</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${siteExpenses
          .map(
            (e) => `
          <tr>
            <td>${e.date || "-"}</td>
            <td>${e.category || "-"}</td>
            <td>${e.note || "-"}</td>
            <td style="text-align: right;">${formatETB(e.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Total Period Expenses:</td>
          <td style="text-align: right; color: #256D5A;">${formatETB(totalExpensesPeriod)}</td>
        </tr>
      </tbody>
    </table>
  `
  }

  <!-- Material Stock Summary Table -->
  <div class="section-title">MATERIAL INVENTORY STATUS (STOCK)</div>
  ${
    stockSummaries.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No materials registered for this site.</p>'
      : `
    <table>
      <thead>
        <tr>
          <th>Material Name</th>
          <th>Unit</th>
          <th>Total Received</th>
          <th>Total Used</th>
          <th style="text-align: right;">In-Stock Balance</th>
        </tr>
      </thead>
      <tbody>
        ${stockSummaries
          .map(
            (stock) => `
          <tr>
            <td><strong>${stock.name}</strong></td>
            <td>${stock.unit}</td>
            <td>${stock.totalIncoming}</td>
            <td>${stock.totalUsed}</td>
            <td style="text-align: right; font-weight: bold; color: ${stock.inStock < 0 ? "#EF4444" : "#256D5A"};">
              ${stock.inStock}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `
  }

  <!-- Material Transaction Log Table -->
  <div class="section-title">MATERIAL TRANSACTION LOG (PERIOD)</div>
  ${
    siteMaterialsPeriod.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No materials tracked in this period.</p>'
      : `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Material Name</th>
          <th>Quantity</th>
          <th>Unit</th>
          <th>Log Type</th>
        </tr>
      </thead>
      <tbody>
        ${siteMaterialsPeriod
          .map(
            (m) => `
          <tr>
            <td>${m.date || "-"}</td>
            <td>${m.name}</td>
            <td>${m.quantity}</td>
            <td>${m.unit}</td>
            <td style="font-weight: bold; color: ${
              (m.type || "").toLowerCase() === "incoming" ? "#256D5A" : "#3B82F6"
            };">
              ${m.type}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `
  }

  <!-- Tasks Status Table -->
  <div class="section-title">TASK LIST STATUS</div>
  ${
    siteTasks.length === 0
      ? '<p style="color: #6B7280; font-style: italic;">No tasks associated with this site.</p>'
      : `
    <table>
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Assigned To</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${siteTasks
          .map(
            (t) => `
          <tr>
            <td>${t.title}</td>
            <td>${getUserName(t.assignedTo)}</td>
            <td>${t.dueDate || "-"}</td>
            <td>${t.priority}</td>
            <td style="font-weight: bold;">${t.status}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `
  }

  <!-- Footer -->
  <div class="footer">
    <span>Site Tracker App &bull; Generated by ${userName}</span>
    <span>Date: ${new Date().toLocaleDateString("en-ET")}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Report Builder</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : sites.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineOfficeBuilding className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">No Sites Available</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You must be assigned to at least one active site to generate reports.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Report Configuration Card */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Criteria</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Construction Site Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Construction Site
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="input"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Report Timeframe
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Metrics Grid for Selected Period */}
            {selectedSite && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary mb-3">
                    Period Summary: {selectedSite.name}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="card p-4 flex items-center gap-3">
                      <div className="bg-emerald-50 p-3 rounded-lg text-primary">
                        <HiOutlineDocumentText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Daily Logs</p>
                        <p className="text-xl font-bold text-gray-900">{siteLogs.length}</p>
                      </div>
                    </div>

                    <div className="card p-4 flex items-center gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg text-secondary">
                        <HiOutlineCash className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Expenses</p>
                        <p className="text-xl font-bold text-gray-900">{formatETB(totalExpensesPeriod)}</p>
                      </div>
                    </div>

                    <div className="card p-4 flex items-center gap-3">
                      <div className="bg-amber-50 p-3 rounded-lg text-warning">
                        <HiOutlineDatabase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Materials Tracked
                        </p>
                        <p className="text-xl font-bold text-gray-900">{siteMaterialsPeriod.length}</p>
                      </div>
                    </div>

                    <div className="card p-4 flex items-center gap-3">
                      <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                        <HiOutlineClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Due Tasks</p>
                        <p className="text-xl font-bold text-gray-900">{siteTasks.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Document Action Card (PDF Export) */}
                <div className="card p-5 bg-emerald-50/50 border-emerald-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-white p-3 rounded-xl">
                        <HiOutlinePrinter className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Ready for Export</h3>
                        <p className="text-sm text-muted-foreground">
                          Download report with {siteLogs.length} logs and {siteExpenses.length} expenses.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handlePrintPdf}
                      className="btn-primary flex items-center justify-center gap-2 px-6 py-3 font-semibold text-base"
                    >
                      <HiOutlinePrinter className="w-5 h-5" />
                      Download / Print PDF Report
                    </button>
                  </div>
                </div>

                {/* 4. Daily Logs Preview */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Logs Preview</h3>
                  {siteLogs.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground italic">
                      No daily logs recorded in this period.
                    </p>
                  ) : (
                    <div className="space-y-4 divide-y divide-gray-100">
                      {siteLogs.map((log) => (
                        <div key={log.id} className="pt-3 first:pt-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-primary">{log.date}</span>
                            <span className="text-xs text-muted-foreground">
                              Workers: {log.workerCount || 0} | Weather: {log.weather || "N/A"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{log.workDone}</p>
                          {log.issues && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              <strong>Issues:</strong> {log.issues}
                            </p>
                          )}
                          {log.nextPlan && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <strong>Next Plan:</strong> {log.nextPlan}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Activity Expenses Preview */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses Preview</h3>
                  {siteExpenses.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground italic">
                      No expenses logged in this period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {siteExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 capitalize">
                              {expense.category}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {expense.date} - {expense.note || "No note"}
                            </p>
                          </div>
                          <p className="font-bold text-gray-900">{formatETB(expense.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Material Stock Status Preview */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Material Stock Status (Current Inventory)
                  </h3>
                  {stockSummaries.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground italic">
                      No materials registered for this site.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                              Material
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                              Unit
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                              Received
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                              Used
                            </th>
                            <th className="px-4 py-2.5 text-right font-semibold text-gray-700">
                              In-Stock Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stockSummaries.map((stock) => {
                            const isNegative = stock.inStock < 0;
                            return (
                              <tr key={`${stock.name}-${stock.unit}`}>
                                <td className="px-4 py-2.5 font-medium text-gray-900">
                                  {stock.name}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">{stock.unit}</td>
                                <td className="px-4 py-2.5 text-gray-800">
                                  {stock.totalIncoming}
                                </td>
                                <td className="px-4 py-2.5 text-gray-800">{stock.totalUsed}</td>
                                <td
                                  className={`px-4 py-2.5 text-right font-bold ${
                                    isNegative ? "text-danger" : "text-primary"
                                  }`}
                                >
                                  {stock.inStock}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
