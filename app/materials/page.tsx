import Link from "next/link";
import { Card, Container, Pill } from "../components";
import { rawMaterials } from "../../lib/raw-materials";

type PageProps = {
  searchParams?: {
    page?: string;
  };
};

const PAGE_SIZE = 12;

export default function MaterialsDirectoryPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(rawMaterials.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const items = rawMaterials
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(start, start + PAGE_SIZE);

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Materials directory</Pill>
        <h1>Materials</h1>
        <p>Paginated list with dedicated detail URLs.</p>
      </header>

      <Card title="Browse materials" subtitle={`Page ${safePage} of ${totalPages}`}>
        <div className="linkChipList">
          {items.map((material) => (
            <Link key={material.slug} href={`/materials/${material.slug}`} className="linkChip">
              <span>{material.name}</span>
              <span>
                {material.category} · {material.dataPoints.length} records
              </span>
            </Link>
          ))}
        </div>

        <div className="paginationControls">
          <Link
            href={`/materials?page=${Math.max(1, safePage - 1)}`}
            className="secondaryButton"
            aria-disabled={safePage === 1}
          >
            Previous
          </Link>
          <p className="sectionIntro">
            Showing {start + 1}-{Math.min(start + PAGE_SIZE, rawMaterials.length)} of{" "}
            {rawMaterials.length}
          </p>
          <Link
            href={`/materials?page=${Math.min(totalPages, safePage + 1)}`}
            className="secondaryButton"
            aria-disabled={safePage === totalPages}
          >
            Next
          </Link>
        </div>
      </Card>
    </Container>
  );
}
