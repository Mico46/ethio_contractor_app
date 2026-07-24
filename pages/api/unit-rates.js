import { db } from "@/lib/firebase-admin";
import { authenticate } from "@/lib/auth-middleware";

// Standard unit rates matching Flutter BoqMockData.getStandardUnitRates()
const INITIAL_UNIT_RATES = [
  { id: 'rate-1', category: 'Substructure', itemDescription: 'Site Excavation up to 1.5m depth', unit: 'm³', standardRate: 250.0, defaultWastageFactor: 5.0 },
  { id: 'rate-2', category: 'Substructure', itemDescription: 'Reinforced Footing Concrete C25/30', unit: 'm³', standardRate: 6500.0, defaultWastageFactor: 8.0 },
  { id: 'rate-3', category: 'Substructure', itemDescription: 'Lean Concrete C15/20 (50mm thk)', unit: 'm³', standardRate: 4200.0, defaultWastageFactor: 5.0 },
  { id: 'rate-4', category: 'Substructure', itemDescription: 'Grade 500 High-Yield Steel Rebar (16mm)', unit: 'Ton', standardRate: 85000.0, defaultWastageFactor: 5.0 },
  { id: 'rate-5', category: 'Concrete Work', itemDescription: '150mm Reinforced Concrete Floor Slab C25/30', unit: 'm³', standardRate: 7200.0, defaultWastageFactor: 7.0 },
  { id: 'rate-6', category: 'Concrete Work', itemDescription: 'Reinforced Concrete Columns C30/37', unit: 'm³', standardRate: 7800.0, defaultWastageFactor: 6.0 },
  { id: 'rate-7', category: 'Concrete Work', itemDescription: 'Reinforced Concrete Beams C25/30', unit: 'm³', standardRate: 7500.0, defaultWastageFactor: 6.0 },
  { id: 'rate-8', category: 'Masonry Work', itemDescription: '200mm Hollow Concrete Block (HCB) Wall', unit: 'm²', standardRate: 650.0, defaultWastageFactor: 5.0 },
  { id: 'rate-9', category: 'Masonry Work', itemDescription: '150mm Hollow Concrete Block (HCB) Wall', unit: 'm²', standardRate: 520.0, defaultWastageFactor: 5.0 },
  { id: 'rate-10', category: 'Masonry Work', itemDescription: '500mm Stone Masonry Foundation Wall', unit: 'm³', standardRate: 1800.0, defaultWastageFactor: 8.0 },
  { id: 'rate-11', category: 'Finishes', itemDescription: 'Internal Cement Plastering 15mm', unit: 'm²', standardRate: 280.0, defaultWastageFactor: 10.0 },
  { id: 'rate-12', category: 'Finishes', itemDescription: 'Porcelain Floor Tiles 60cm x 60cm', unit: 'm²', standardRate: 1200.0, defaultWastageFactor: 8.0 },
  { id: 'rate-13', category: 'Finishes', itemDescription: '3-Coat Internal Acrylic Paint', unit: 'm²', standardRate: 180.0, defaultWastageFactor: 7.5 },
  { id: 'rate-14', category: 'Roofing & Waterproofing', itemDescription: 'Corrugated Steel Roofing Sheet 0.5mm', unit: 'm²', standardRate: 850.0, defaultWastageFactor: 6.0 },
  { id: 'rate-15', category: 'Roofing & Waterproofing', itemDescription: '4mm Bituminous Waterproofing Membrane', unit: 'm²', standardRate: 450.0, defaultWastageFactor: 5.0 },
  { id: 'rate-16', category: 'Mechanical & Electrical (MEP)', itemDescription: '20mm Rigid PVC Electrical Conduit', unit: 'm', standardRate: 95.0, defaultWastageFactor: 5.0 },
  { id: 'rate-17', category: 'Mechanical & Electrical (MEP)', itemDescription: '3x2.5mm² Copper Electrical Cable', unit: 'm', standardRate: 150.0, defaultWastageFactor: 5.0 },
];

export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        const snapshot = await db.collection("unit_rates").get();
        let rates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (rates.length === 0) {
          // Seed initial unit rates
          const batch = db.batch();
          for (const rate of INITIAL_UNIT_RATES) {
            const docRef = db.collection("unit_rates").doc(rate.id);
            batch.set(docRef, rate);
          }
          await batch.commit();
          rates = INITIAL_UNIT_RATES;
        }

        res.status(200).json(rates);
      } catch (error) {
        console.error("Error fetching unit rates:", error);
        res.status(500).json({ error: "Failed to fetch unit rates" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        const docRef = await db.collection("unit_rates").add({
          category: data.category || "Substructure",
          itemDescription: data.itemDescription || "",
          unit: data.unit || "m³",
          standardRate: Number(data.standardRate) || 0.0,
          defaultWastageFactor: Number(data.defaultWastageFactor) || 5.0,
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data });
      } catch (error) {
        console.error("Error creating unit rate:", error);
        res.status(500).json({ error: "Failed to create unit rate" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        await db.collection("unit_rates").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating unit rate:", error);
        res.status(500).json({ error: "Failed to update unit rate" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("unit_rates").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting unit rate:", error);
        res.status(500).json({ error: "Failed to delete unit rate" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
