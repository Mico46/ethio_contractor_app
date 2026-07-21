import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter Expense model: { id, siteId, category, amount, note, date, syncStatus }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("expenses");
        if (req.query.siteId) {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!isAdmin(user)) {
          expenses = expenses.filter((e) => canManageSite(user, e.siteId));
        }

        res.status(200).json(expenses);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Failed to fetch expenses" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("expenses").add({
          siteId: data.siteId || "", category: data.category || "",
          amount: Number(data.amount) || 0, note: data.note || "",
          date: data.date || new Date().toISOString(), syncStatus: "synced",
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ error: "Failed to create expense" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("expenses").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ error: "Failed to update expense" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("expenses").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ error: "Failed to delete expense" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
