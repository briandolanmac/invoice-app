export type ParsedLineItem = {
  item_type: "service" | "expense";
  description: string;
  line_date: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  sort_order: number;
};

function num(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : fallback;
}

function parseGroup(
  formData: FormData,
  prefix: string,
  itemType: "service" | "expense",
  sortOffset: number
): ParsedLineItem[] {
  const count = Math.max(0, Math.min(500, num(formData.get(`${prefix}_count`), 0)));
  const rows: ParsedLineItem[] = [];

  for (let i = 0; i < count; i++) {
    const description = String(formData.get(`${prefix}_desc_${i}`) || "").trim();
    if (!description) continue;

    rows.push({
      item_type: itemType,
      description,
      line_date: String(formData.get(`${prefix}_date_${i}`) || "").trim() || null,
      quantity: num(formData.get(`${prefix}_qty_${i}`), 1),
      unit: null, // no longer collected in the form (rows are labeled Hours/Rate); legacy rows keep their DB value
      unit_price: num(formData.get(`${prefix}_price_${i}`), 0),
      sort_order: sortOffset + i,
    });
  }

  return rows;
}

/** Parses the two LineItemsSection groups (service charges + expenses) a form posts. */
export function parseLineItems(formData: FormData): ParsedLineItem[] {
  const serviceRows = parseGroup(formData, "svc", "service", 0);
  const expenseRows = parseGroup(formData, "exp", "expense", serviceRows.length);
  return [...serviceRows, ...expenseRows];
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
