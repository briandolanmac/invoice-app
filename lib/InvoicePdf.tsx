import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type PdfLineItem = {
  item_type: string;
  description: string;
  line_date: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type PdfInvoiceData = {
  invoice_number: string;
  invoice_date: string;
  tour_group_name: string | null;
  customer_reference: string | null;
  notes: string | null;
  payment_instructions: string | null;
  subtotal_amount: number;
  expense_amount: number;
  total_amount: number;
  agency: {
    name: string;
    billing_address: string | null;
  };
  serviceItems: PdfLineItem[];
  expenseItems: PdfLineItem[];
};

const ACCENT = "#d6336c";
const ACCENT_DARK = "#a61e4d";
const MUTED = "#9d5c7c";
const BORDER = "#f0c9dc";

const styles = StyleSheet.create({
  page: {
    color: "#3a1f2e",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
  },
  title: {
    color: ACCENT,
    fontFamily: "Helvetica",
    fontSize: 26,
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: ACCENT_DARK,
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  hr: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    color: ACCENT_DARK,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  toBlock: {
    textAlign: "right",
  },
  tourName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 14,
  },
  sectionLabel: {
    color: ACCENT_DARK,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
    marginTop: 10,
  },
  table: {
    marginBottom: 6,
  },
  tableHeaderRow: {
    backgroundColor: ACCENT,
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tableHeaderCell: {
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  cellDate: { width: "16%" },
  cellDesc: { width: "54%" },
  cellRate: { width: "15%", textAlign: "right" },
  cellTotal: { width: "15%", textAlign: "right" },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  subtotalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalRow: {
    borderTopColor: ACCENT,
    borderTopWidth: 1.5,
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
    paddingTop: 10,
  },
  totalLabel: {
    color: ACCENT_DARK,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginRight: 10,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  notesBlock: {
    marginTop: 20,
  },
  notesText: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    bottom: 40,
    left: 40,
    position: "absolute",
    right: 40,
    textAlign: "center",
  },
  footerPayable: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
  footerThanks: {
    color: MUTED,
    fontSize: 9,
    marginBottom: 10,
  },
  footerContact: {
    color: ACCENT_DARK,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
});

function money(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatShortDate(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

function ItemsTable({ items }: { items: PdfLineItem[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.cellDate]}>DATE</Text>
        <Text style={[styles.tableHeaderCell, styles.cellDesc]}>DESCRIPTION</Text>
        <Text style={[styles.tableHeaderCell, styles.cellRate]}>QTY x RATE</Text>
        <Text style={[styles.tableHeaderCell, styles.cellTotal]}>TOTAL</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.cellDate}>{formatShortDate(item.line_date)}</Text>
          <Text style={styles.cellDesc}>{item.description}</Text>
          <Text style={styles.cellRate}>
            {item.quantity} x {money(item.unit_price)}
          </Text>
          <Text style={styles.cellTotal}>{money(item.line_total)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InvoicePdfDocument({ invoice }: { invoice: PdfInvoiceData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.subtitle}>RIE DOLAN — INDEPENDENT TOUR GUIDE</Text>
        <View style={styles.hr} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.value}>{formatDate(invoice.invoice_date)}</Text>
            <Text style={styles.label}>INVOICE #</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
            {invoice.customer_reference ? (
              <>
                <Text style={styles.label}>REFERENCE</Text>
                <Text style={styles.value}>{invoice.customer_reference}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.toBlock}>
            <Text style={styles.label}>TO</Text>
            <Text style={styles.value}>{invoice.agency.name}</Text>
            {invoice.agency.billing_address
              ? invoice.agency.billing_address.split(",").map((line, i) => (
                  <Text key={i} style={styles.value}>
                    {line.trim()}
                  </Text>
                ))
              : null}
          </View>
        </View>

        {invoice.tour_group_name ? (
          <Text style={styles.tourName}>{invoice.tour_group_name}</Text>
        ) : null}

        {invoice.serviceItems.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>SERVICE CHARGES</Text>
            <ItemsTable items={invoice.serviceItems} />
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>Subtotal: {money(invoice.subtotal_amount)}</Text>
            </View>
          </>
        ) : null}

        {invoice.expenseItems.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>EXPENSES</Text>
            <ItemsTable items={invoice.expenseItems} />
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>Subtotal: {money(invoice.expense_amount)}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{money(invoice.total_amount)}</Text>
        </View>

        {invoice.notes || invoice.payment_instructions ? (
          <View style={styles.notesBlock}>
            {invoice.notes ? <Text style={styles.notesText}>{invoice.notes}</Text> : null}
            {invoice.payment_instructions ? (
              <Text style={styles.notesText}>{invoice.payment_instructions}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerPayable}>MAKE ALL CHECKS PAYABLE TO: RIE DOLAN</Text>
          <Text style={styles.footerThanks}>Thank you for your business!</Text>
          <Text style={styles.footerContact}>
            RIE DOLAN, 585 WEST END AVENUE #14A | NEW YORK, NY, 10024 | PHONE: 646-831-9276
          </Text>
        </View>
      </Page>
    </Document>
  );
}
