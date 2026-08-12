import Link from "next/link";

type InvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  return (
    <main className="page">
      <section className="shell card" style={{ padding: 24 }}>
        <Link href="/" style={{ textDecoration: "none" }}>Back to dashboard</Link>
        <h1>Invoice detail</h1>
        <p className="muted">
          Invoice {id} will open here once we add editing, copying, and PDF generation.
        </p>
      </section>
    </main>
  );
}
