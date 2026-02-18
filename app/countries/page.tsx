import Link from "next/link";
import { Card, Container, Pill } from "../components";
import { getCountryProfiles } from "../../lib/countries";

type PageProps = {
  searchParams?: {
    page?: string;
  };
};

const PAGE_SIZE = 16;
const countryProfiles = getCountryProfiles().sort((a, b) => a.name.localeCompare(b.name));

export default function CountriesDirectoryPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(countryProfiles.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const items = countryProfiles.slice(start, start + PAGE_SIZE);

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Countries directory</Pill>
        <h1>Countries</h1>
        <p>Paginated list with direct country drilldown pages.</p>
      </header>

      <Card title="Browse countries" subtitle={`Page ${safePage} of ${totalPages}`}>
        <div className="linkChipList">
          {items.map((country) => (
            <Link key={country.slug} href={`/countries/${country.slug}`} className="linkChip">
              <span>{country.name}</span>
              <span>{country.roleBreakdown.totalFlows} flows</span>
            </Link>
          ))}
        </div>

        <div className="paginationControls">
          <Link
            href={`/countries?page=${Math.max(1, safePage - 1)}`}
            className="secondaryButton"
            aria-disabled={safePage === 1}
          >
            Previous
          </Link>
          <p className="sectionIntro">
            Showing {start + 1}-{Math.min(start + PAGE_SIZE, countryProfiles.length)} of{" "}
            {countryProfiles.length}
          </p>
          <Link
            href={`/countries?page=${Math.min(totalPages, safePage + 1)}`}
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
