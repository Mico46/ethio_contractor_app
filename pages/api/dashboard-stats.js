import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin } from "@/lib/auth-middleware";

export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const sitesSnapshot = await db.collection("sites").get();
    let sites = sitesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Non-admin: only show assigned sites
    if (!isAdmin(user)) {
      sites = sites.filter((s) => s.assignedTo === user.id || s.id === user.assignedSite);
    }

    const siteIds = sites.map((s) => s.id);

    const expensesSnapshot = await db.collection("expenses").get();
    let expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (!isAdmin(user)) {
      expenses = expenses.filter((e) => siteIds.includes(e.siteId));
    }

    const usersSnapshot = await db.collection("users").get();
    const totalWorkers = usersSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.role === "worker" || data.role === "foreman";
    }).length;

    const pendingSync = sites.filter((s) => s.syncStatus === "pending").length;
    const totalBudget = sites.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const activeSites = sites.filter((s) => s.status === "active").length;

    res.status(200).json({
      totalSites: sites.length,
      activeSites,
      pendingSync,
      totalBudget,
      totalExpenses,
      totalWorkers,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}
