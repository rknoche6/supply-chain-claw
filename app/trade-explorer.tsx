"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, SectionHeader, StatCard, StatGrid } from "./components";
import { categories, tradeFlows } from "../lib/trade-data";
import RouteMap from "./route-map";

type CategoryFilter = (typeof categories)[number];
type ViewMode = "cards" | "table";
type SortMode = "relevance" | "product" | "importers" | "exporters";
type CountryRoleFilter = "any" | "importer" | "exporter";

type CountryTagListProps = {
  countries: string[];
  activeCountry: string;
  onPickCountry: (countryName: string) => void;
};

function CountryTagList({ countries, activeCountry, onPickCountry }: CountryTagListProps) {
  return (
    <div className="countryTags" role="list">
      {countries.map((countryName) => (
        <button
          key={countryName}
          type="button"
          className={`countryTagButton ${activeCountry === countryName ? "isActive" : ""}`}
          onClick={() => onPickCountry(countryName)}
          role="listitem"
        >
          {countryName}
        </button>
      ))}
    </div>
  );
}

export default function TradeExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [country, setCountry] = useState("All countries");
  const [countryRole, setCountryRole] = useState<CountryRoleFilter>("any");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const countries = useMemo(() => {
    const all = new Set<string>();
    for (const flow of tradeFlows) {
      flow.topImporters.forEach((item) => all.add(item));
      flow.topExporters.forEach((item) => all.add(item));
    }
    return ["All countries", ...Array.from(all).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tradeFlows.filter((flow) => {
      const byCategory = category === "All" || flow.category === category;
      const byCountry =
        country === "All countries" ||
        (countryRole !== "exporter" && flow.topImporters.includes(country)) ||
        (countryRole !== "importer" && flow.topExporters.includes(country));
      const byQuery =
        q.length === 0 ||
        flow.product.toLowerCase().includes(q) ||
        flow.keyRoute.toLowerCase().includes(q) ||
        flow.topImporters.some((item) => item.toLowerCase().includes(q)) ||
        flow.topExporters.some((item) => item.toLowerCase().includes(q));
      return byCategory && byCountry && byQuery;
    });
  }, [category, country, countryRole, query]);

  const sortedFlows = useMemo(() => {
    const items = [...filtered];

    if (sortMode === "product") {
      items.sort((a, b) => a.product.localeCompare(b.product));
    }

    if (sortMode === "importers") {
      items.sort((a, b) => b.topImporters.length - a.topImporters.length);
    }

    if (sortMode === "exporters") {
      items.sort((a, b) => b.topExporters.length - a.topExporters.length);
    }

    return items;
  }, [filtered, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [query, category, country, countryRole, sortMode, viewMode, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedFlows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedFlows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, sortedFlows.length);
  const pagedFlows = sortedFlows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const topImporters = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((flow) =>
      flow.topImporters.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const topExporters = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((flow) =>
      flow.topExporters.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const countrySpotlight = useMemo(() => {
    if (country === "All countries") {
      return null;
    }

    const importerFlows = filtered.filter((flow) => flow.topImporters.includes(country));
    const exporterFlows = filtered.filter((flow) => flow.topExporters.includes(country));
    const uniqueProducts = Array.from(
      new Set([...importerFlows, ...exporterFlows].map((flow) => flow.product))
    );

    return {
      name: country,
      importerFlows,
      exporterFlows,
      uniqueProducts,
    };
  }, [country, filtered]);

  const mappedRoutes = useMemo(() => {
    return filtered.map((flow, index) => ({
      id: `${flow.product}-${index}`,
      product: flow.product,
      stops: flow.keyRoute.split("→").map((item) => item.trim()),
    }));
  }, [filtered]);

  useEffect(() => {
    if (mappedRoutes.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    if (selectedRouteId && mappedRoutes.some((route) => route.id === selectedRouteId)) {
      return;
    }

    setSelectedRouteId(mappedRoutes[0].id);
  }, [mappedRoutes, selectedRouteId]);

  const selectedRoute =
    selectedRouteId === null
      ? null
      : (mappedRoutes.find((route) => route.id === selectedRouteId) ?? null);

  return (
    <>
      <Card>
        <SectionHeader
          eyebrow="Explore"
          title="Global supply-chain search"
          description="Search products and routes, filter by category, and drill down by individual country."
        />

        <div className="filters">
          <label>
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="GPU, copper, banana, Rotterdam..."
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Country role
            <select
              value={countryRole}
              onChange={(e) => setCountryRole(e.target.value as CountryRoleFilter)}
            >
              <option value="any">Any role</option>
              <option value="importer">Importer only</option>
              <option value="exporter">Exporter only</option>
            </select>
          </label>
        </div>

        {country === "All countries" && countryRole !== "any" ? (
          <p className="sectionIntro">
            Country role filter applies after selecting a specific country.
          </p>
        ) : null}

        <div className="filterActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setCountry("All countries");
              setCountryRole("any");
              setSortMode("relevance");
              setPageSize(6);
              setPage(1);
            }}
          >
            Reset filters
          </button>
        </div>

        <div className="activeFilters" aria-live="polite">
          <span className="activeFiltersLabel">Active filters</span>
          <div className="activeFiltersList">
            {query.trim().length > 0 ? (
              <button type="button" className="activeFilterChip" onClick={() => setQuery("")}>
                Search: {query.trim()} ×
              </button>
            ) : null}
            {category !== "All" ? (
              <button type="button" className="activeFilterChip" onClick={() => setCategory("All")}>
                Category: {category} ×
              </button>
            ) : null}
            {country !== "All countries" ? (
              <button
                type="button"
                className="activeFilterChip"
                onClick={() => setCountry("All countries")}
              >
                Country: {country} ×
              </button>
            ) : null}
            {countryRole !== "any" ? (
              <button
                type="button"
                className="activeFilterChip"
                onClick={() => setCountryRole("any")}
              >
                Role: {countryRole} ×
              </button>
            ) : null}
            {sortMode !== "relevance" ? (
              <button
                type="button"
                className="activeFilterChip"
                onClick={() => setSortMode("relevance")}
              >
                Sort: {sortMode} ×
              </button>
            ) : null}
            {query.trim().length === 0 &&
            category === "All" &&
            country === "All countries" &&
            countryRole === "any" &&
            sortMode === "relevance" ? (
              <span className="sectionIntro">None</span>
            ) : null}
          </div>
        </div>
      </Card>

      <Card
        title="Importers and exporters summary"
        subtitle="Top countries in the current filtered view."
      >
        <StatGrid>
          <StatCard label="Matching flows" value={String(filtered.length)} />
          <StatCard
            label="Categories in view"
            value={String(new Set(filtered.map((f) => f.category)).size)}
          />
          <article className="statCard">
            <p className="statLabel">Top importers</p>
            <ul className="miniList">
              {topImporters.map(([name, count]) => (
                <li key={name}>
                  <button
                    type="button"
                    className={`quickFilterButton ${country === name ? "isActive" : ""}`}
                    onClick={() => setCountry(name)}
                  >
                    {name} <span>({count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article className="statCard">
            <p className="statLabel">Top exporters</p>
            <ul className="miniList">
              {topExporters.map(([name, count]) => (
                <li key={name}>
                  <button
                    type="button"
                    className={`quickFilterButton ${country === name ? "isActive" : ""}`}
                    onClick={() => setCountry(name)}
                  >
                    {name} <span>({count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </StatGrid>
      </Card>

      {countrySpotlight ? (
        <Card
          title={`Country spotlight: ${countrySpotlight.name}`}
          subtitle="See whether this country appears as an importer, exporter, or both in the active filters."
        >
          <div className="spotlightGrid">
            <article className="statCard">
              <p className="statLabel">As importer</p>
              <p className="statValue">{countrySpotlight.importerFlows.length}</p>
              <p className="statHint">matching flows</p>
            </article>
            <article className="statCard">
              <p className="statLabel">As exporter</p>
              <p className="statValue">{countrySpotlight.exporterFlows.length}</p>
              <p className="statHint">matching flows</p>
            </article>
          </div>

          <div>
            <p className="statLabel">Products in spotlight</p>
            {countrySpotlight.uniqueProducts.length > 0 ? (
              <ul className="miniList">
                {countrySpotlight.uniqueProducts.map((product) => (
                  <li key={product}>{product}</li>
                ))}
              </ul>
            ) : (
              <p className="sectionIntro">No products in the current filter context.</p>
            )}
          </div>
        </Card>
      ) : null}

      <Card
        title="Filtered route map"
        subtitle="Tap a route to spotlight its exact path. Great for comparing corridors on mobile and desktop."
      >
        {mappedRoutes.length > 0 ? (
          <>
            <div className="routePicker" role="list" aria-label="Filtered route options">
              {mappedRoutes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  role="listitem"
                  className={`routePickerButton ${selectedRouteId === route.id ? "isActive" : ""}`}
                  onClick={() => setSelectedRouteId(route.id)}
                >
                  <span>{route.product}</span>
                  <span>{route.stops.join(" → ")}</span>
                </button>
              ))}
            </div>

            {selectedRoute ? (
              <p className="sectionIntro">
                Spotlight: <strong>{selectedRoute.product}</strong> ·{" "}
                {selectedRoute.stops.join(" → ")}
              </p>
            ) : null}

            <RouteMap routes={mappedRoutes} selectedRouteId={selectedRouteId} />
          </>
        ) : (
          <p className="sectionIntro">No mappable routes for the current filters.</p>
        )}
      </Card>

      <Card
        title="Filtered supply flows"
        subtitle="Focus on what matters now — products, routes, and country participation."
      >
        <div className="flowToolbar">
          <p className="sectionIntro">
            {sortedFlows.length} results · Showing {pageStart}-{pageEnd}
          </p>
          <div className="flowToolbarControls">
            <label>
              Data view
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                aria-label="Select data view"
              >
                <option value="cards">Cards</option>
                <option value="table">Table</option>
              </select>
            </label>
            <label>
              Sort by
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Select sort order"
              >
                <option value="relevance">Relevance</option>
                <option value="product">Product A-Z</option>
                <option value="importers">Most importers</option>
                <option value="exporters">Most exporters</option>
              </select>
            </label>
            <label>
              Per page
              <select
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Select page size"
              >
                <option value="6">6</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </label>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="flowList">
            {pagedFlows.map((flow) => (
              <article key={`${flow.category}-${flow.product}`} className="flowCard">
                <p className="flowCategory">{flow.category}</p>
                <h3>{flow.product}</h3>
                <p className="flowRoute">{flow.keyRoute}</p>
                <div>
                  <p>
                    <strong>Importers</strong>
                  </p>
                  <CountryTagList
                    countries={flow.topImporters}
                    activeCountry={country}
                    onPickCountry={setCountry}
                  />
                </div>
                <div>
                  <p>
                    <strong>Exporters</strong>
                  </p>
                  <CountryTagList
                    countries={flow.topExporters}
                    activeCountry={country}
                    onPickCountry={setCountry}
                  />
                </div>
              </article>
            ))}
            {sortedFlows.length === 0 ? <p>No matching flows yet. Try a broader filter.</p> : null}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Route</th>
                  <th>Importers</th>
                  <th>Exporters</th>
                </tr>
              </thead>
              <tbody>
                {pagedFlows.map((flow) => (
                  <tr key={`${flow.category}-${flow.product}`}>
                    <td>{flow.product}</td>
                    <td>{flow.category}</td>
                    <td>{flow.keyRoute}</td>
                    <td>
                      <CountryTagList
                        countries={flow.topImporters}
                        activeCountry={country}
                        onPickCountry={setCountry}
                      />
                    </td>
                    <td>
                      <CountryTagList
                        countries={flow.topExporters}
                        activeCountry={country}
                        onPickCountry={setCountry}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedFlows.length === 0 ? <p>No matching flows yet. Try a broader filter.</p> : null}
          </div>
        )}

        {sortedFlows.length > 0 ? (
          <div className="paginationControls" aria-label="Data pagination controls">
            <button
              type="button"
              className="secondaryButton"
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <p className="sectionIntro">
              Page {currentPage} of {totalPages}
            </p>
            <button
              type="button"
              className="secondaryButton"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </Card>
    </>
  );
}
