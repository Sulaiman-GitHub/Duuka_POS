"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { applyStockChange, StockError } from "@/lib/inventory";
import { requirePermission } from "@/lib/session";

const schema = z.object({
  saleId: z.string().min(1),
  reason: z.string().trim().min(3, "Please give a reason for the return.").max(200),
  restock: z.boolean(),
  items: z.array(z.object({ saleItemId: z.string().min(1), quantity: z.number().int().min(0) })),
});

export type ReturnResult = { error?: string; ok?: boolean };

export async function processReturn(input: unknown): Promise<ReturnResult> {
  const user = await requirePermission("sales.refund");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const requested = d.items.filter((i) => i.quantity > 0);
  if (requested.length === 0) return { error: "Choose at least one item to return." };

  try {
    await db.$transaction(async (tx) => {
      // Lock the sale row so two simultaneous returns can't both refund the same items.
      await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${d.saleId} FOR UPDATE`;
      const sale = await tx.sale.findUnique({
        where: { id: d.saleId },
        include: { items: { include: { returns: { select: { quantity: true } } } }, returns: { select: { refundTotal: true } } },
      });
      if (!sale) throw new StockError("Sale not found.");

      const alreadyRefunded = sale.returns.reduce((s, r) => s + r.refundTotal, 0);
      const lines = requested.map((r) => {
        const item = sale.items.find((i) => i.id === r.saleItemId);
        if (!item) throw new StockError("An item does not belong to this sale.");
        const returned = item.returns.reduce((s, x) => s + x.quantity, 0);
        if (r.quantity > item.quantity - returned) throw new StockError(`Only ${item.quantity - returned} of "${item.productName}" can still be returned.`);
        // Refund the price actually paid: the sale-level discount is shared proportionally across items.
        const share = sale.subtotal > 0 ? sale.total / sale.subtotal : 1;
        return { item, quantity: r.quantity, returnedAfter: returned + r.quantity, refund: Math.round(item.unitPrice * r.quantity * share) };
      });

      // If this return completes the sale, settle any rounding difference so refunds sum exactly to the total paid.
      const fullyReturned = sale.items.every((i) => {
        const l = lines.find((x) => x.item.id === i.id);
        const returned = i.returns.reduce((s, x) => s + x.quantity, 0) + (l?.quantity ?? 0);
        return returned === i.quantity;
      });
      let refundTotal = lines.reduce((s, l) => s + l.refund, 0);
      if (fullyReturned) {
        const diff = sale.total - alreadyRefunded - refundTotal;
        lines[lines.length - 1].refund += diff;
        refundTotal += diff;
      }
      if (alreadyRefunded + refundTotal > sale.total) throw new StockError("Refund would exceed the amount paid.");

      await tx.saleReturn.create({
        data: {
          saleId: sale.id, processedBy: user.id, reason: d.reason, refundTotal,
          items: { create: lines.map((l) => ({ saleItemId: l.item.id, quantity: l.quantity, refundAmount: l.refund })) },
        },
      });
      if (d.restock)
        for (const l of lines) await applyStockChange(tx, l.item.productId, l.quantity, "RETURN", { userId: user.id, reference: sale.receiptNo, reason: d.reason, allowInactive: true });
      await tx.sale.update({ where: { id: sale.id }, data: { status: fullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }
  await audit(user.id, "sale.return", "Sale", d.saleId, d.reason);
  revalidatePath("/", "layout");
  return { ok: true };
}
