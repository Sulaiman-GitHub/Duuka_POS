"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { CASHIER_MAX_DISCOUNT_PERCENT } from "@/lib/business";
import { db } from "@/lib/db";
import { applyStockChange, StockError } from "@/lib/inventory";
import { requirePermission } from "@/lib/session";
import { kampalaDateString } from "@/lib/time";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(100000) })).min(1, "The cart is empty.").max(200),
  discountType: z.enum(["amount", "percent"]),
  discountValue: z.number().min(0),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER"]),
  amountPaid: z.number().int().min(0),
  customerName: z.string().trim().max(80).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  reference: z.string().trim().max(80).optional(),
});

export type SaleResult = { error?: string; saleId?: string };

async function nextReceiptNo(tx: Pick<typeof db, "sale">) {
  const prefix = `RCP-${kampalaDateString().replace(/-/g, "")}-`;
  const last = await tx.sale.findFirst({ where: { receiptNo: { startsWith: prefix } }, orderBy: { receiptNo: "desc" }, select: { receiptNo: true } });
  const n = last ? parseInt(last.receiptNo.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(n).padStart(4, "0");
}

export async function completeSale(input: unknown): Promise<SaleResult> {
  const user = await requirePermission("pos.sell");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Merge duplicate lines so stock is checked against the combined quantity.
  const qty = new Map<string, number>();
  for (const it of d.items) qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.quantity);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const sale = await db.$transaction(async (tx) => {
        const products = await tx.product.findMany({ where: { id: { in: [...qty.keys()] } }, select: { id: true, name: true, sku: true, sellPrice: true, costPrice: true, isActive: true } });
        if (products.length !== qty.size) throw new StockError("A product in the cart no longer exists.");

        // Prices always come from the database, never from the browser.
        const lines = products.map((p) => {
          if (!p.isActive) throw new StockError(`"${p.name}" is inactive and can't be sold.`);
          const quantity = qty.get(p.id)!;
          return { p, quantity, lineTotal: p.sellPrice * quantity };
        });
        const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

        const rawDiscount = d.discountType === "percent" ? Math.round((subtotal * d.discountValue) / 100) : Math.round(d.discountValue);
        if (rawDiscount > subtotal) throw new StockError("Discount cannot exceed the subtotal.");
        if (user.role === "CASHIER" && rawDiscount > (subtotal * CASHIER_MAX_DISCOUNT_PERCENT) / 100)
          throw new StockError(`Cashiers can give at most ${CASHIER_MAX_DISCOUNT_PERCENT}% discount. Ask a manager to approve more.`);
        const discount = rawDiscount;
        const total = subtotal - discount;

        let amountPaid = d.amountPaid;
        if (d.paymentMethod === "CASH") {
          if (amountPaid < total) throw new StockError("Cash received is less than the total.");
        } else amountPaid = total;

        const receiptNo = await nextReceiptNo(tx);
        const sale = await tx.sale.create({
          data: {
            receiptNo, cashierId: user.id, subtotal, discount, total, paymentMethod: d.paymentMethod, amountPaid, changeGiven: amountPaid - total,
            customerName: d.customerName || null, customerPhone: d.customerPhone || null, note: d.reference || null,
            items: { create: lines.map((l) => ({ productId: l.p.id, productName: l.p.name, sku: l.p.sku, quantity: l.quantity, unitPrice: l.p.sellPrice, unitCost: l.p.costPrice, lineTotal: l.lineTotal })) },
          },
        });
        for (const l of lines) await applyStockChange(tx, l.p.id, -l.quantity, "SALE", { userId: user.id, reference: receiptNo });
        return sale;
      });
      await audit(user.id, "sale.create", "Sale", sale.id, `${sale.receiptNo} total ${sale.total}`);
      revalidatePath("/", "layout");
      return { saleId: sale.id };
    } catch (e) {
      if (e instanceof StockError) return { error: e.message };
      // Two tills finishing at the same moment can pick the same receipt number; retry with the next one.
      if (typeof e === "object" && e && (e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }
  return { error: "Could not generate a receipt number. Please try again." };
}
