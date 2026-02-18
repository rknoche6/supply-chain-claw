import Link from "next/link";
import { Card, Container, Pill } from "../components";
import { getCountryProfiles } from "../../lib/countries";

type CountrySort = "name" | "flows" | "importers" | "exporters" | "materials";

type PageProps = {
  searchParams?: {
    page?: string;
    q?: string;
    role?: string;
    sort?: string;
  };
};

const PAGE_SIZE = 16;
const countryProfiles = getCountryProfiles();

export default function CountriesDirectoryPage({ searchParams }: PageProps) {
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const selectedRole =
    searchParams?.role === "importer" || searchParams?.role === "exporter"
      ? searchParams.role
      : "all";
  const selectedSort: CountrySort =
    searchParams?.sort === "flows" ||
    searchParams?.sort === "importers" ||
    searchParams?.sort === "exporters" ||
    searchParams?.sort === "materials"
      ? (searchParams.sort as CountrySort)
      : "name";

  const filteredAndSortedCountries = countryProfiles
    .filter((country) => {
      const queryMatches =
        query.length === 0 ||
        country.name.toLowerCase().includes(query) ||
        country.products.some((item) => item.product.toLowerCase().includes(query));

      const roleMatches =
        selectedRole === "all" ||
        (selectedRole === "importer" && country.roleBreakdown.importerCount > 0) ||
        (selectedRole === "exporter" && country.roleBreakdown.exporterCount > 0);

      return queryMatches && roleMatches;
    })
    .sort((a, b) => {
      if (selectedSort === "flows") {
        return (
          b.roleBreakdown.totalFlows - a.roleBreakdown.totalFlows || a.name.localeCompare(b.name)
        );
      }

      if (selectedSort === "importers") {
        return (
          b.roleBreakdown.importerCount - a.roleBreakdown.importerCount ||
          a.name.localeCompare(b.name)
        );
      }

      if (selectedSort === "exporters") {
        return (
          b.roleBreakdown.exporterCount - a.roleBreakdown.exporterCount ||
          a.name.localeCompare(b.name)
        );
      }

      if (selectedSort === "materials") {
        return b.materialRecords.length - a.materialRecords.length || a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });

  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCountries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const items = filteredAndSortedCountries.slice(start, start + PAGE_SIZE);

  const buildDirectoryHref = (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage) });

    if (searchParams?.q) {
      params.set("q", searchParams.q);
    }

    if (selectedRole !== "all") {
      params.set("role", selectedRole);
    }

    if (selectedSort !== "name") {
      params.set("sort", selectedSort);
    }

    return `/countries?${params.toString()}`;
  };

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Countries directory</Pill>
        <h1>Countries</h1>
        <p>Paginated list with direct country drilldown pages.</p>
      </header>

      <Card
        title="Browse countries"
        subtitle={`Page ${safePage} of ${totalPages} · ${filteredAndSortedCountries.length} matches`}
      >
        <form method="get" className="filterActions" style={{ marginBottom: "0.75rem" }}>
          <label>
            Search country or product
            <input
              type="search"
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="e.g. copper, lithium, Australia"
            />
          </label>

          <label>
            Role coverage
            <select name="role" defaultValue={selectedRole}>
              <option value="all">All countries</option>
              <option value="importer">Importer participants</option>
              <option value="exporter">Exporter participants</option>
            </select>
          </label>

          <label>
            Sort by
            <select name="sort" defaultValue={selectedSort}>
              <option value="name">Name (A-Z)</option>
              <option value="flows">Total flows (high to low)</option>
              <option value="importers">Importer roles (high to low)</option>
              <option value="exporters">Exporter roles (high to low)</option>
              <option value="materials">Material records (high to low)</option>
            </select>
          </label>

          <button type="submit" className="secondaryButton">
            Apply filters
          </button>
          <Link href="/countries" className="secondaryButton" prefetch={false}>
            Reset
          </Link>
        </form>

        {items.length > 0 ? (
          <div className="linkChipList">
            {items.map((country) => (
              <Link key={country.slug} href={`/countries/${country.slug}`} className="linkChip">
                <span>{country.name}</span>
                <span>
                  {country.roleBreakdown.totalFlows} flows · {country.roleBreakdown.importerCount}{" "}
                  import · {country.roleBreakdown.exporterCount} export
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="sectionIntro">No country matches for the current filters.</p>
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
            {Math.min(start + PAGE_SIZE, filteredAndSortedCountries.length)} of{" "}
            {filteredAndSortedCountries.length}
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
