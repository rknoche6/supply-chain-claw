import Link from "next/link";
import { Card, Container, Pill } from "../components";
import {
  getDataPointConfidence,
  getFreshnessLabel,
  rawMaterialCategories,
  rawMaterials,
  type MaterialCategory,
} from "../../lib/raw-materials";

type MaterialSort = "name" | "records" | "latest-year" | "high-confidence-share" | "source-count";

type PageProps = {
  searchParams?: {
    page?: string;
    q?: string;
    category?: string;
    confidence?: string;
    sort?: string;
  };
};

type MaterialDirectoryRow = {
  name: string;
  slug: string;
  category: MaterialCategory;
  recordCount: number;
  latestYear: number;
  sourceCount: number;
  highConfidenceCount: number;
  currentOrRecentCount: number;
};

const PAGE_SIZE = 12;
const validCategories = rawMaterialCategories.filter((item) => item !== "All");

function toDirectoryRow(item: (typeof rawMaterials)[number]): MaterialDirectoryRow {
  const latestYear = Math.max(...item.dataPoints.map((point) => point.year));
  const sourceCount = new Set(item.dataPoints.map((point) => point.sourceUrl)).size;
  const highConfidenceCount = item.dataPoints.filter(
    (point) => getDataPointConfidence(point) === "High"
  ).length;
  const currentOrRecentCount = item.dataPoints.filter((point) => {
    const freshness = getFreshnessLabel(point.year, item.updatedAt);
    return freshness === "Current" || freshness === "Recent";
  }).length;

  return {
    name: item.name,
    slug: item.slug,
    category: item.category,
    recordCount: item.dataPoints.length,
    latestYear,
    sourceCount,
    highConfidenceCount,
    currentOrRecentCount,
  };
}

export default function MaterialsDirectoryPage({ searchParams }: PageProps) {
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const selectedCategory =
    searchParams?.category && validCategories.includes(searchParams.category as MaterialCategory)
      ? (searchParams.category as MaterialCategory)
      : "all";
  const selectedConfidence =
    searchParams?.confidence === "high-only" || searchParams?.confidence === "high-majority"
      ? searchParams.confidence
      : "all";
  const selectedSort: MaterialSort =
    searchParams?.sort === "records" ||
    searchParams?.sort === "latest-year" ||
    searchParams?.sort === "high-confidence-share" ||
    searchParams?.sort === "source-count"
      ? (searchParams.sort as MaterialSort)
      : "name";

  const filteredAndSortedMaterials = rawMaterials
    .map(toDirectoryRow)
    .filter((material) => {
      const queryMatches = query.length === 0 || material.name.toLowerCase().includes(query);
      const categoryMatches = selectedCategory === "all" || material.category === selectedCategory;
      const confidenceMatches =
        selectedConfidence === "all" ||
        (selectedConfidence === "high-only" &&
          material.highConfidenceCount === material.recordCount) ||
        (selectedConfidence === "high-majority" &&
          material.highConfidenceCount / material.recordCount >= 0.75);

      return queryMatches && categoryMatches && confidenceMatches;
    })
    .sort((a, b) => {
      if (selectedSort === "records") {
        return b.recordCount - a.recordCount || a.name.localeCompare(b.name);
      }

      if (selectedSort === "latest-year") {
        return b.latestYear - a.latestYear || a.name.localeCompare(b.name);
      }

      if (selectedSort === "high-confidence-share") {
        const shareDiff =
          b.highConfidenceCount / b.recordCount - a.highConfidenceCount / a.recordCount;
        return shareDiff || b.recordCount - a.recordCount || a.name.localeCompare(b.name);
      }

      if (selectedSort === "source-count") {
        return b.sourceCount - a.sourceCount || a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });

  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMaterials.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const items = filteredAndSortedMaterials.slice(start, start + PAGE_SIZE);

  const buildDirectoryHref = (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage) });

    if (searchParams?.q) {
      params.set("q", searchParams.q);
    }

    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }

    if (selectedConfidence !== "all") {
      params.set("confidence", selectedConfidence);
    }

    if (selectedSort !== "name") {
      params.set("sort", selectedSort);
    }

    return `/materials?${params.toString()}`;
  };

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Materials directory</Pill>
        <h1>Materials</h1>
        <p>Explorer list with search, filters, and citation-readiness sorting.</p>
      </header>

      <Card
        title="Browse materials"
        subtitle={`Page ${safePage} of ${totalPages} · ${filteredAndSortedMaterials.length} matches`}
      >
        <form method="get" className="filterActions" style={{ marginBottom: "0.75rem" }}>
          <label>
            Search material
            <input
              type="search"
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="e.g. copper, lithium"
            />
          </label>

          <label>
            Category
            <select name="category" defaultValue={selectedCategory}>
              <option value="all">All categories</option>
              {validCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Confidence coverage
            <select name="confidence" defaultValue={selectedConfidence}>
              <option value="all">All confidence mixes</option>
              <option value="high-only">100% high-confidence records</option>
              <option value="high-majority">At least 75% high-confidence</option>
            </select>
          </label>

          <label>
            Sort by
            <select name="sort" defaultValue={selectedSort}>
              <option value="name">Name (A-Z)</option>
              <option value="records">Record count (high to low)</option>
              <option value="latest-year">Latest year (newest first)</option>
              <option value="high-confidence-share">High-confidence share (high to low)</option>
              <option value="source-count">Distinct sources (high to low)</option>
            </select>
          </label>

          <button type="submit" className="secondaryButton">
            Apply filters
          </button>
          <Link href="/materials" className="secondaryButton" prefetch={false}>
            Reset
          </Link>
        </form>

        {items.length > 0 ? (
          <div className="linkChipList">
            {items.map((material) => (
              <Link key={material.slug} href={`/materials/${material.slug}`} className="linkChip">
                <span>{material.name}</span>
                <span>
                  {material.category} · {material.recordCount} records · latest{" "}
                  {material.latestYear}
                </span>
                <span>
                  High confidence {material.highConfidenceCount}/{material.recordCount} ·
                  Current/recent {material.currentOrRecentCount}/{material.recordCount} ·{" "}
                  {material.sourceCount} source
                  {material.sourceCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="sectionIntro">No materials match the current filters.</p>
        )}

        <div className="paginationControls">
          <Link
            href={buildDirectoryHref(Math.max(1, safePage - 1))}
            className="secondaryButton"
            aria-disabled={safePage === 1}
          >
            Previous
          </Link>
          <p className="sectionIntro">
            Showing {items.length === 0 ? 0 : start + 1}-
            {Math.min(start + PAGE_SIZE, filteredAndSortedMaterials.length)} of{" "}
            {filteredAndSortedMaterials.length}
          </p>
          <Link
            href={buildDirectoryHref(Math.min(totalPages, safePage + 1))}
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
