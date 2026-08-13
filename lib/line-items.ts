const VALID_TYPES = new Set(["service", "expense", "tip", "adjustment"]);

export type ParsedLineItem = {
  item_type: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  sort_order: number;
};

function num(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : fallback;
}

/** Parses the dynamic `line_count` rows a LineItemsSection form posts. */
export function parseLineItems(formData: FormData): ParsedLineItem[] {
  const count = Math.max(0, Math.min(500, num(formData.get("line_count"), 0)));
  const rows: ParsedLineItem[] = [];

  for (let i = 0; i < count; i++) {
    const description = String(formData.get(`line_desc_${i}`) || "").trim();
    if (!description) continue;

    const type = String(formData.get(`line_type_${i}`) || "service");
    rows.push({
      item_type: VALID_TYPES.has(type) ? type : "service",
      description,
      quantity: num(formData.get(`line_qty_${i}`), 1),
      unit: String(formData.get(`line_unit_${i}`) || "").trim() || null,
      unit_price: num(formData.get(`line_price_${i}`), 0),
      sort_order: i,
    });
  }

  return rows;
}

export function totalsFor(rows: ParsedLineItem[]) {
  const subtotal = rows
    .filter((r) => r.item_type !== "expense")
    .reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  const expenses = rows
    .filter((r) => r.item_type === "expense")
    .reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  return { subtotal, expenses, total: subtotal + expenses };
}
