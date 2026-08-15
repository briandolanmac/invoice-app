/** Historical invoice numbers use inconsistent formats (RD-001, RD007,
 *  RD202501, "RD-006 - Updated"). The rule that covers all of them: take
 *  the LAST contiguous run of digits in the string as the sequence
 *  number ("RD2026-003" -> 003, "RD-006 - Updated" -> 006), find the
 *  highest across an agent's invoices, and increment it -- padded to at
 *  least the same width as the number it beat, so "003" -> "004" rather
 *  than "4". */
export function nextInvoiceNumber(prefix: string, existingNumbers: string[]): string {
  let maxValue = 0;
  let padWidth = 3;

  for (const num of existingNumbers) {
    const matches = num.match(/\d+/g);
    if (!matches || !matches.length) continue;
    const last = matches[matches.length - 1];
    const value = parseInt(last, 10);
    if (value > maxValue) {
      maxValue = value;
      padWidth = last.length;
    }
  }

  const next = String(maxValue + 1).padStart(padWidth, "0");
  return `${prefix}-${next}`;
}
