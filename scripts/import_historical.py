"""
One-time import of Rie's 19 real historical invoice PDFs into Supabase.

- Creates the FSI Enterprise Inc. agency (not previously seeded).
- Creates 16 invoice records (17 unique invoices minus 1 rate-sheet PDF
  that isn't an invoice) with their real line items, transcribed by hand
  from each PDF.
- Two of the 19 files are superseded drafts of the same invoice number
  (May JTB "added round trip cost" supersedes the earlier May JTB draft;
  Jan 2026 "Adjusted" supersedes the earlier Jan 2026 draft) -- only the
  final/corrected version gets a DB invoice record. Both PDF files are
  still uploaded to Storage and attached to the surviving invoice so
  nothing is lost.
- Uploads every invoice PDF to Supabase Storage (bucket
  'invoice-application') and links it via invoice_files.
- JSG Tariff RD 2026.pdf is Rie's own rate card, not a client invoice --
  intentionally not imported (no invoice/agency to attach it to).

Run once: python3 scripts/import_historical.py
"""
import json
import mimetypes
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT_URL = "https://dmtqlbpmcsovheutexen.supabase.co"
SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
BUCKET = "invoice-application"
SRC_DIR = Path("/Users/briandolan/Documents/Rie Invoices")

HEADERS_JSON = {
    "apikey": SECRET_KEY,
    "Authorization": f"Bearer {SECRET_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def api(method, path, body=None, headers=None):
    url = f"{PROJECT_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or HEADERS_JSON)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        print(f"  ! {method} {path} -> {e.code}: {e.read().decode()[:300]}")
        raise


def get_agency_id(customer_code=None, name=None):
    q = f"customer_code=eq.{customer_code}" if customer_code else f"name=eq.{urllib.parse.quote(name)}"
    result = api("GET", f"/rest/v1/agencies?{q}&select=id")
    return result[0]["id"] if result else None


# --- Agencies -----------------------------------------------------------

FSI = get_agency_id(name="FSI Enterprise Inc.")
if not FSI:
    created = api("POST", "/rest/v1/agencies", {
        "name": "FSI Enterprise Inc.",
        "billing_address": "60-11 Broadway #5G, Woodside, NY 11377",
        "payment_terms": "Due on receipt",
        "default_invoice_prefix": "FSIRD",
    })
    FSI = created[0]["id"]
    print(f"Created FSI Enterprise Inc. -> {FSI}")

JTB = get_agency_id(customer_code="JTB")
NYVIP = get_agency_id(customer_code="NYVIP")
AQUESTRO = get_agency_id(customer_code="AQUESTRO")
print(f"JTB={JTB} NYVIP={NYVIP} AQUESTRO={AQUESTRO} FSI={FSI}")

# --- Invoices -------------------------------------------------------------
# Each: invoice fields + line items. line item item_type in
# service|expense|tip|adjustment. qty*unit_price = line_total (DB-generated).

INVOICES = [
    {
        "invoice_number": "RD-001", "agency": JTB,
        "invoice_date": "2025-05-29", "due_date": "2025-06-07",
        "pdf": "Rie Dolan Invoice May 2025.pdf",
        "items": [
            ("service", "Advisor Tour -Welcome Manhattan – 4/30/2025", "2025-04-30", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan – 5/1/2025", "2025-05-01", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan – 5/12/2025", "2025-05-12", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan – 5/14/2025", "2025-05-14", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan – 5/15/2025", "2025-05-15", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan – 5/19/2025", "2025-05-19", 1, None, 40.00),
        ],
    },
    {
        "invoice_number": "RD-002", "agency": JTB,
        "invoice_date": "2025-09-30", "due_date": "2025-10-14",
        "pdf": "Rie Dolan Invoice Sept 2025 PDF.pdf",
        "items": [
            ("service", "Advisor Tour -Welcome Manhattan", "2025-08-21", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan", "2025-09-04", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan", "2025-09-18", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan", "2025-09-22", 1, None, 40.00),
            ("service", "Statue of Liberty Tour", "2025-09-15", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2025-09-17", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2025-09-24", 1, None, 120.00),
            ("expense", "MTA Subway Omni Charge (Training session)", "2025-08-29", 2, None, 2.90),
            ("expense", "MTA Subway Omni Card – New card fee", "2025-09-13", 2, None, 1.00),
            ("expense", "MTA Subway Omni Charge", "2025-09-15", 7, None, 2.90),
            ("expense", "MTA Subway Omni Charge", "2025-09-17", 3, None, 2.90),
            ("expense", "MTA Subway Omni Charge", "2025-09-24", 5, None, 2.90),
        ],
    },
    {
        "invoice_number": "RD-003", "agency": JTB,
        "invoice_date": "2025-11-04", "due_date": "2025-11-18",
        "pdf": "Rie Dolan Invoice Oct 2025.pdf",
        "items": [
            ("service", "Advisor Tour -Welcome Manhattan", "2025-10-20", 1, None, 40.00),
            ("service", "Advisor Tour -Welcome Manhattan", "2025-10-23", 1, None, 40.00),
            ("service", "Statue of Liberty Tour", "2025-10-27", 1, None, 120.00),
            ("service", "Advisor Tour -Welcome Manhattan", "2025-10-30", 1, None, 40.00),
            ("expense", "MTA Subway Omni Charge", "2025-10-27", 3, None, 2.90),
        ],
    },
    {
        "invoice_number": "RD-004", "agency": JTB,
        "invoice_date": "2025-12-07", "due_date": "2025-12-21",
        "pdf": "Rie Dolan Invoice Nov  2025 .pdf",
        "items": [
            ("service", "Statue of Liberty Tour", "2025-11-14", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2025-11-17", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2025-11-21", 1, None, 120.00),
            ("expense", "MTA Subway Omni Charge", "2025-11-14", 3, None, 2.90),
            ("expense", "MTA Subway Omni Charge", "2025-11-17", 3, None, 2.90),
            ("expense", "MTA Subway Omni Charge", "2025-11-21", 3, None, 2.90),
        ],
    },
    {
        "invoice_number": "RD202501", "agency": NYVIP,
        "invoice_date": "2025-12-06", "due_date": "2025-12-20",
        "tour_group_name": "URAWA REIMEI HIGH SCHOOL",
        "pdf": "Rie Dolan Invoice Dec HS Tour 2025 DOC.pdf",
        "items": [
            ("service", "JFK In + Sightseeing (09:50 – 19:50) + 1H/DH", "2025-12-01", 11, "hour", 40.00),
            ("service", "Surcharge for Metropolitan Museum", "2025-12-01", 1, None, 50.00),
            ("service", "Sightseeing (08:00 – 19:00)", "2025-12-02", 11, "hour", 40.00),
            ("service", "UN Interpreter", "2025-12-02", 1, None, 50.00),
            ("service", "Sightseeing (08:20 – 20:20)", "2025-12-03", 12, "hour", 40.00),
            ("service", "Sightseeing (08:00 – 23:00)", "2025-12-04", 14.5, "hour", 40.00),
            ("service", "Surcharge for Natural History Museum", "2025-12-04", 1, None, 50.00),
            ("service", "Sightseeing + JFK Out (14:00 – 23:30) +1H/DH", "2025-12-05", 10.5, "hour", 40.00),
            ("expense", "Subway ticket", "2025-12-01", 1, None, 2.90),
            ("expense", "AirTrain", "2025-12-01", 1, None, 8.50),
            ("expense", "LIRR", "2025-12-01", 1, None, 5.00),
        ],
    },
    {
        "invoice_number": "RD-005", "agency": JTB,
        "invoice_date": "2026-01-04",
        "pdf": "Rie Dolan Invoice - Dec 2025.pdf",
        "items": [
            ("service", "Statue of Liberty Tour", "2025-12-22", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2025-12-29", 1, None, 120.00),
            ("expense", "MTA Subway Omni Charge (3 x Clients + Guide)", "2025-12-22", 4, None, 2.90),
            ("expense", "MTA Subway Omni Charge (4 x Clients + Guide)", "2025-12-29", 5, None, 2.90),
        ],
    },
    {
        "invoice_number": "RD-006 - Updated", "agency": JTB,
        "invoice_date": "2026-03-03",
        "pdf": "Rie Dolan Invoice Jan 2026 Adjusted.pdf",
        "archive_pdfs": ["Rie Dolan Invoice Jan 2026.pdf"],
        "items": [
            ("service", "Statue of Liberty Tour", "2026-01-05", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2026-01-07", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2026-02-13", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2026-02-20", 1, None, 120.00),
            ("expense", "MTA Subway Omni Charge (2 x Clients + 2 x Guide trip)", "2026-01-05", 1, None, 12.00),
            ("expense", "MTA Subway Omni Charge (2 x Clients + 2 x Guide trip)", "2026-01-07", 1, None, 12.00),
            ("expense", "MTA Subway Omni Charge (2 x Clients + 2 x Guide trip)", "2026-02-13", 1, None, 12.00),
            ("expense", "MTA Subway Omni Charge (2 x Clients + 2 x Guide trip)", "2026-02-20", 1, None, 12.00),
            ("adjustment", "MTA Subway adjustment 9 trips @ $2.90", None, 9, None, 2.90),
        ],
    },
    {
        "invoice_number": "RD007", "agency": JTB,
        "invoice_date": "2026-03-31",
        "pdf": "Rie Dolan Invoice  Mar JTB 2026.pdf",
        "items": [
            ("service", "[Advisor Tour] Welcome Manhattan", "2026-03-05", 1, None, 40.00),
            ("service", "Statue of Liberty Tour", "2026-03-06", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2026-03-16", 1, None, 120.00),
            ("service", "Statue of Liberty Tour", "2026-03-18", 1, None, 120.00),
            ("service", "[Advisor Tour] Welcome Manhattan", "2026-03-23", 1, None, 40.00),
            ("service", "[Advisor Tour] Welcome Manhattan", "2026-03-26", 1, None, 40.00),
            ("service", "Statue of Liberty Tour", "2026-03-27", 1, None, 120.00),
            ("expense", "Subway ticket (2 guests + guide)", "2026-03-06", 4, None, 3.00),
            ("expense", "Subway ticket (5 guests + guide)", "2026-03-16", 7, None, 3.00),
            ("expense", "Subway ticket (4 guests + guide)", "2026-03-18", 6, None, 3.00),
            ("expense", "Subway ticket (2 guests + guide)", "2026-03-27", 4, None, 3.00),
        ],
    },
    {
        "invoice_number": "RD202601", "agency": NYVIP,
        "invoice_date": "2026-03-22",
        "tour_group_name": "SOSA HIGH SCHOOL",
        "pdf": "Rie Dolan Invoice  Mar HS Tour 2026.pdf",
        "items": [
            ("service", "JFK In + Sightseeing (10:45 – 18:30) + 1H/DH", "2026-03-19", 9, "hour", 40.00),
            ("service", "Sightseeing (09:00 – 17:30)", "2026-03-20", 8.5, "hour", 40.00),
            ("service", "Bus Loading", "2026-03-21", 1, None, 120.00),
            ("expense", "Subway ticket", "2026-03-19", 1, None, 3.00),
            ("expense", "LIRR", "2026-03-19", 1, None, 7.25),
            ("expense", "AirTrain", "2026-03-19", 1, None, 8.75),
        ],
    },
    {
        "invoice_number": "FSIRD202601", "agency": FSI,
        "invoice_date": "2026-05-20",
        "tour_group_name": "GUCCI NYC TOUR",
        "pdf": "Rie Dolan Invoice - May 20-2026.pdf",
        "items": [
            ("service", "Tour Guide – 10.00 – 16:30", "2026-05-16", 6, "hour", 40.00),
            ("tip", "Tip @ $5 p/hr", "2026-04-14", 6, "hour", 5.00),
        ],
    },
    {
        "invoice_number": "RD202605", "agency": NYVIP,
        "invoice_date": "2026-05-20",
        "tour_group_name": "HEI TYO // UT541-0514A26",
        "pdf": "Rie Dolan Invoice  NY VIP May 20 2026.pdf",
        "items": [
            ("service", "Deadhead fee – 9:30 – 18:30", "2026-05-18", 1, "hour", 40.00),
            ("service", "Tour – 9:30 – 18:30", "2026-05-18", 9, "hour", 40.00),
            ("service", "Museum Tour", "2026-05-18", 1, "hour", 50.00),
            ("service", "Tour 1:30 – 19:30", "2026-05-19", 6, "hour", 40.00),
        ],
    },
    {
        "invoice_number": "RD010", "agency": JTB,
        "invoice_date": "2026-06-10",
        "pdf": "Rie Dolan Invoice  May JTB 2026 - added round trip cost.pdf",
        "archive_pdfs": ["Rie Dolan Invoice  May JTB 2026.pdf"],
        "items": [
            ("service", "1010 Statue of Liberty Tour + One World Observation (4 people)", "2026-05-01", 1, None, 170.00),
            ("service", "1100 MLB Yankees (Outfield 1st FL) (1 person) / 1101 MLB Yankees (Infield 1st FL) (3 people)", "2026-05-02", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation / 1015 + Ground Zero by subway (2 people)", "2026-05-04", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation (4 people)", "2026-05-11", 1, None, 120.00),
            ("service", "1015 Statue of Liberty + Ground Zero by subway (2 people)", "2026-05-15", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation (2 people)", "2026-05-22", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation (2 people)", "2026-05-27", 1, None, 120.00),
            ("expense", "Subway ticket (4 guests + guide round trip)", "2026-05-01", 1, None, 18.00),
            ("expense", "Subway ticket (4 guests + guide round trip)", "2026-05-02", 1, None, 18.00),
            ("expense", "Subway ticket (4 guests + guide round trip)", "2026-05-04", 1, None, 18.00),
            ("expense", "Subway ticket (4 guests + guide round trip)", "2026-05-11", 1, None, 18.00),
            ("expense", "Subway ticket (2 guests + guide round trip)", "2026-05-15", 1, None, 12.00),
            ("expense", "Subway ticket (2 guests + guide round trip)", "2026-05-22", 1, None, 12.00),
            ("expense", "Subway ticket (2 guests + guide round trip)", "2026-05-27", 1, None, 12.00),
        ],
    },
    {
        "invoice_number": "RD011", "agency": JTB,
        "invoice_date": "2026-07-07",
        "pdf": "Rie Dolan Invoice  June JTB 2026.pdf",
        "items": [
            ("service", "1010 Statue of Liberty Tour + One World Observation / 1015 + Ground Zero by subway (3 people)", "2026-06-08", 1, None, 120.00),
            ("expense", "Subway ticket (3 guests + guide x2)", "2026-06-08", 1, None, 15.00),
        ],
    },
    {
        "invoice_number": "RD202606", "agency": NYVIP,
        "invoice_date": "2026-08-03",
        "pdf": "Rie Dolan Invoice  NY VIP July 2026.pdf",
        "items": [
            ("service", "Shukugawa Gakuin Research Trip 10:00 – 18:00", "2026-07-14", 8, "hour", 40.00),
            ("tip", "Tip @ $5 x 8 hours", "2026-07-14", 8, "hour", 5.00),
            ("service", "Daiichi Sankyo 07:45 – 23:30", "2026-07-21", 16, "hour", 40.00),
            ("tip", "Tip @ $5 x 16 hours", "2026-07-21", 16, "hour", 5.00),
            ("expense", "Late night Uber from hotel to home", "2026-07-21", 1, None, 25.94),
        ],
    },
    {
        "invoice_number": "RD012", "agency": JTB,
        "invoice_date": "2026-08-02",
        "pdf": "Rie Dolan Invoice  July JTB 2026.pdf",
        "items": [
            ("service", "Private Guide Charter x 1", "2026-07-04", 1, None, 120.00),
            ("service", "1015 Statue of Liberty + Ground Zero by subway (2 Customers)", "2026-07-10", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation (2 Customers)", "2026-07-15", 1, None, 120.00),
            ("service", "1010 Statue of Liberty Tour + One World Observation (5 Customers)", "2026-07-17", 1, None, 120.00),
            ("service", "1015 Statue of Liberty + Ground Zero by subway (3 Customers)", "2026-07-27", 1, None, 120.00),
            ("expense", "Subway ticket (guide round trip)", "2026-07-04", 1, None, 6.00),
            ("expense", "Subway ticket (2 guests + guide round trip)", "2026-07-10", 1, None, 12.00),
            ("expense", "Subway ticket (2 guests + guide round trip)", "2026-07-15", 1, None, 12.00),
            ("expense", "Subway ticket (5 guests + guide round trip)", "2026-07-17", 1, None, 21.00),
            ("expense", "Subway ticket (3 guests + guide round trip)", "2026-07-27", 1, None, 15.00),
        ],
    },
    {
        "invoice_number": "RDAQ20261", "agency": AQUESTRO,
        "invoice_date": "2026-08-03",
        "tour_group_name": "MINAMI UONUMA group",
        "pdf": "Rie Dolan Invoice Aquestro Inc Aug 2026.pdf",
        "items": [
            ("service", "MET Guided Tour", "2026-08-01", 1, "hour", 50.00),
            ("tip", "Tip @ $5 per hour", "2026-08-01", 1, "hour", 5.00),
        ],
    },
]

# PDF-stated totals, for a sanity cross-check against qty*price sums (not
# written to the DB -- just printed if they disagree).
EXPECTED_TOTALS = {
    "RD-001": 240.00, "RD-002": 571.30, "RD-003": 248.70, "RD-004": 386.10,
    "RD202501": 2526.40, "RD-005": 266.10, "RD-006 - Updated": 554.10,
    "RD007": 663.00, "RD202601": 839.00, "FSIRD202601": 270.00,
    "RD202605": 690.00, "RD010": 998.00, "RD011": 135.00, "RD202606": 1105.94,
    "RD012": 666.00, "RDAQ20261": 55.00,
}


def upload_pdf(local_filename, invoice_number):
    src = SRC_DIR / local_filename
    storage_path = f"historical/{invoice_number.replace(' ', '_').replace('/', '-')}/{local_filename}"
    content_type = mimetypes.guess_type(local_filename)[0] or "application/pdf"
    data = src.read_bytes()
    req = urllib.request.Request(
        f"{PROJECT_URL}/storage/v1/object/{BUCKET}/{urllib.parse.quote(storage_path)}",
        data=data, method="POST",
        headers={
            "apikey": SECRET_KEY,
            "Authorization": f"Bearer {SECRET_KEY}",
            "Content-Type": content_type,
        },
    )
    try:
        with urllib.request.urlopen(req):
            pass
    except urllib.error.HTTPError as e:
        print(f"  ! upload failed for {local_filename}: {e.code} {e.read().decode()[:200]}")
        return None
    return storage_path


def main():
    for inv in INVOICES:
        number = inv["invoice_number"]
        print(f"--- {number} ({inv['pdf']}) ---")

        existing = api("GET", f"/rest/v1/invoices?invoice_number=eq.{urllib.parse.quote(number)}&select=id")
        if existing:
            print(f"  already exists, skipping")
            continue

        subtotal = sum(q * p for t, _, _, q, _, p in inv["items"] if t != "expense")
        expenses = sum(q * p for t, _, _, q, _, p in inv["items"] if t == "expense")
        total = round(subtotal + expenses, 2)
        expected = EXPECTED_TOTALS.get(number)
        if expected is not None and abs(total - expected) > 0.01:
            print(f"  ! TOTAL MISMATCH: computed {total} vs PDF-stated {expected}")

        created = api("POST", "/rest/v1/invoices", {
            "agency_id": inv["agency"],
            "invoice_number": number,
            "invoice_date": inv["invoice_date"],
            "due_date": inv.get("due_date"),
            "tour_group_name": inv.get("tour_group_name"),
            "status": "sent",
            "subtotal_amount": round(subtotal, 2),
            "expense_amount": round(expenses, 2),
            "total_amount": total,
        })
        invoice_id = created[0]["id"]

        rows = []
        for i, (item_type, desc, line_date, qty, unit, price) in enumerate(inv["items"]):
            rows.append({
                "invoice_id": invoice_id, "item_type": item_type, "description": desc,
                "line_date": line_date, "quantity": qty, "unit": unit, "unit_price": price,
                "sort_order": i,
            })
        api("POST", "/rest/v1/invoice_line_items", rows)
        print(f"  created invoice + {len(rows)} line items, total ${total}")

        pdfs_to_archive = [inv["pdf"]] + inv.get("archive_pdfs", [])
        for pdf_name in pdfs_to_archive:
            storage_path = upload_pdf(pdf_name, number)
            if not storage_path:
                continue
            api("POST", "/rest/v1/invoice_files", {
                "invoice_id": invoice_id,
                "storage_bucket": BUCKET,
                "storage_path": storage_path,
                "file_name": pdf_name,
                "file_type": "application/pdf",
                "file_role": "uploaded_archive",
            })
            print(f"  archived {pdf_name}")


if __name__ == "__main__":
    main()
