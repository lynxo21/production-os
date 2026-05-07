import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

function hasUnitData(row: Record<string, string | null | undefined>): boolean {
  return !!(row.serial_number || row.unit_id || row.purchase_date || row.purchase_price || row.vendor);
}

async function generateUnitId(orgId: string, prefix: string): Promise<string> {
  const existing = await prisma.itemUnit.findMany({
    where: { item: { organizationId: orgId }, barcode: { startsWith: `${prefix}-` } },
    select: { barcode: true },
  });
  const nums = existing
    .map(u => parseInt(u.barcode!.slice(prefix.length + 1)))
    .filter(n => !isNaN(n) && n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rows } = await req.json();

    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    const unitIdPrefix = (org?.settings as any)?.unitIdPrefix || "UNIT";

    let modelsCreated = 0;
    let modelsUpdated = 0;
    let unitsAdded = 0;
    let rowsSkipped = 0;

    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const name = String(row.name || "").trim();
      if (!name) { rowsSkipped++; continue; }
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(row);
    }

    for (const [modelName, modelRows] of grouped.entries()) {
      const firstRow = modelRows[0];
      const anyUnitData = modelRows.some(hasUnitData);

      let item = await prisma.item.findFirst({ where: { organizationId: orgId, name: modelName } });

      if (!item) {
        const preset = String(firstRow.category || "").toUpperCase();
        item = await prisma.item.create({
          data: {
            organizationId: orgId,
            name: modelName,
            preset: ["MODEL", "CONTAINER", "PACKAGE"].includes(preset) ? (preset as "MODEL" | "CONTAINER" | "PACKAGE") : "MODEL",
            shortName: firstRow.short_name || null,
            shorthand: firstRow.shorthand || null,
            manufacturer: firstRow.manufacturer || null,
            standardDayRate: firstRow.day_rate ? parseFloat(firstRow.day_rate) : null,
            replacementCost: firstRow.replacement_cost ? parseFloat(firstRow.replacement_cost) : null,
            size: firstRow.size || null,
            narrativeDescription: firstRow.narrative_description || null,
            purchaseCost: firstRow.purchase_cost ? parseFloat(firstRow.purchase_cost) : null,
            countryOfManufacture: firstRow.country_of_manufacture || null,
            notes: firstRow.notes || null,
            trackedBySerial: anyUnitData,
          },
        });
        modelsCreated++;

        if (!anyUnitData) {
          await prisma.itemStock.create({
            data: { itemId: item.id, quantityOwned: 1, quantityAvailable: 1 },
          });
        }
      } else {
        // Only upgrade trackedBySerial, never downgrade
        if (anyUnitData && !item.trackedBySerial) {
          await prisma.item.update({ where: { id: item.id }, data: { trackedBySerial: true } });
          item = { ...item, trackedBySerial: true };
        }
        modelsUpdated++;
      }

      if (anyUnitData) {
        for (const row of modelRows) {
          if (!hasUnitData(row)) continue;

          if (row.serial_number) {
            const dupe = await prisma.itemUnit.findFirst({
              where: { serialNumber: row.serial_number, item: { organizationId: orgId } },
            });
            if (dupe) { rowsSkipped++; continue; }
          }

          const barcodeValue = row.unit_id || await generateUnitId(orgId, unitIdPrefix);

          let purchaseDate: Date | null = null;
          if (row.purchase_date) {
            const d = new Date(row.purchase_date);
            if (!isNaN(d.getTime())) purchaseDate = d;
          }

          await prisma.itemUnit.create({
            data: {
              itemId: item.id,
              serialNumber: row.serial_number || null,
              barcode: barcodeValue,
              condition: row.condition || "Excellent",
              purchaseDate,
              purchasePrice: row.purchase_price ? parseFloat(row.purchase_price) : null,
              vendor: row.vendor || null,
            },
          });
          unitsAdded++;
        }
      }
    }

    return NextResponse.json({ modelsCreated, modelsUpdated, unitsAdded, rowsSkipped });
  } catch (error) {
    console.error("POST /api/inventory/import error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
