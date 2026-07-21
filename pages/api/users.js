import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter Users model: { id, name, email, role, assignedSite }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        const snapshot = await db.collection("users").get();
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
      break;

    case "POST":
      if (!isAdmin(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      try {
        const { name, email, role, assignedSite } = req.body;
        const docRef = await db.collection("users").add({
          name: name || "", email: email || "", role: role || "not assigned",
          assignedSite: assignedSite || "", createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, name, email, role, assignedSite });
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
      break;

    case "PUT":
      if (!isAdmin(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      try {
        const { id, ...updates } = req.body;
        await db.collection("users").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
      break;

    case "DELETE":
      if (!isAdmin(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      try {
        const { id } = req.body;
        await db.collection("users").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
