"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionHeader, StatCard, StatGrid } from "./components";
import { getCountryProfiles, toCountrySlug } from "../lib/countries";
import { rawMaterials } from "../lib/raw-materials";
import { categories, tradeFlows } from "../lib/trade-data";
import RouteMap from "./route-map";

type CategoryFilter = (typeof categories)[number];
type ViewMode = "cards" | "table";
type SortMode = "relevance" | "product" | "importers" | "exporters";
type CountryRoleFilter = "any" | "importer" | "exporter";
type MaterialLinkMode = "all" | "linked";

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
  const [materialLinkMode, setMaterialLinkMode] = useState<MaterialLinkMode>("all");
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

  const countryProfiles = useMemo(() => getCountryProfiles(), []);

  const countrySlugSet = useMemo(
    () => new Set(countryProfiles.map((profile) => profile.slug)),
    [countryProfiles]
  );

  const fallbackCompareSlug = countryProfiles[0]?.slug ?? "";

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
      const hasMaterialDataset = rawMaterials.some((material) => {
        const materialName = material.name.toLowerCase();
        const normalizedFlowProduct = flow.product.toLowerCase();

        return (
          normalizedFlowProduct.includes(materialName) ||
          materialName.includes(normalizedFlowProduct)
        );
      });
      const byMaterialLink = materialLinkMode === "all" || hasMaterialDataset;

      return byCategory && byCountry && byQuery && byMaterialLink;
    });
  }, [category, country, countryRole, materialLinkMode, query]);

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
  }, [query, category, country, countryRole, materialLinkMode, sortMode, viewMode, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedFlows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedFlows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, sortedFlows.length);
  const pagedFlows = sortedFlows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const materialLinkedFlowCount = useMemo(() => {
    return filtered.filter((flow) => {
      return rawMaterials.some((material) => {
        const materialName = material.name.toLowerCase();
        const normalizedFlowProduct = flow.product.toLowerCase();

        return (
          normalizedFlowProduct.includes(materialName) ||
          materialName.includes(normalizedFlowProduct)
        );
      });
    }).length;
  }, [filtered]);

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

  const countryRoleLeaderboard = useMemo(() => {
    const counts = new Map<string, { importerCount: number; exporterCount: number }>();

    for (const flow of filtered) {
      for (const importer of flow.topImporters) {
        const existing = counts.get(importer) ?? { importerCount: 0, exporterCount: 0 };
        existing.importerCount += 1;
        counts.set(importer, existing);
      }

      for (const exporter of flow.topExporters) {
        const existing = counts.get(exporter) ?? { importerCount: 0, exporterCount: 0 };
        existing.exporterCount += 1;
        counts.set(exporter, existing);
      }
    }

    return Array.from(counts.entries())
      .map(([name, row]) => {
        const slug = toCountrySlug(name);
        const importerShare = filtered.length > 0 ? (row.importerCount / filtered.length) * 100 : 0;
        const exporterShare = filtered.length > 0 ? (row.exporterCount / filtered.length) * 100 : 0;

        return {
          name,
          slug,
          hasDetailPage: countrySlugSet.has(slug),
          importerCount: row.importerCount,
          exporterCount: row.exporterCount,
          totalCount: row.importerCount + row.exporterCount,
          importerShare,
          exporterShare,
        };
      })
      .sort((a, b) => b.totalCount - a.totalCount || a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [countrySlugSet, filtered]);

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
    return filtered.map((flow, index) => {
      const topImporter = flow.topImporters[0] ?? null;
      const topExporter = flow.topExporters[0] ?? null;
      const importerSlug = topImporter ? toCountrySlug(topImporter) : null;
      const exporterSlug = topExporter ? toCountrySlug(topExporter) : null;
      const hasCompareCountries =
        importerSlug !== null &&
        exporterSlug !== null &&
        countrySlugSet.has(importerSlug) &&
        countrySlugSet.has(exporterSlug) &&
        importerSlug !== exporterSlug;

      const routeStops = flow.keyRoute.split("→").map((item) => item.trim());
      const matchesCountryFilter =
        country !== "All countries" &&
        (flow.topImporters.includes(country) || flow.topExporters.includes(country));
      const matchedMaterial =
        rawMaterials.find((material) => {
          const materialName = material.name.toLowerCase();
          const normalizedFlowProduct = flow.product.toLowerCase();

          return (
            normalizedFlowProduct.includes(materialName) ||
            materialName.includes(normalizedFlowProduct)
          );
        }) ?? null;

      return {
        id: `${flow.product}-${index}`,
        product: flow.product,
        category: flow.category,
        stops: routeStops,
        topImporter,
        topExporter,
        matchedMaterial,
        matchesCountryFilter,
        compareHref: hasCompareCountries
          ? `/compare?leftCountry=${exporterSlug}&rightCountry=${importerSlug}`
          : null,
      };
    });
  }, [country, countrySlugSet, filtered]);

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

  const primaryExchangeLanes = useMemo(() => {
    const laneCounts = new Map<
      string,
      {
        exporter: string;
        importer: string;
        exporterSlug: string;
        importerSlug: string;
        compareHref: string | null;
        flowCount: number;
        categories: Set<string>;
        products: string[];
        linkedMaterials: Set<string>;
        matchedFlowCount: number;
      }
    >();

    for (const flow of filtered) {
      const exporter = flow.topExporters[0] ?? null;
      const importer = flow.topImporters[0] ?? null;

      if (!exporter || !importer) {
        continue;
      }

      const exporterSlug = toCountrySlug(exporter);
      const importerSlug = toCountrySlug(importer);
      const hasCompareCountries =
        exporterSlug !== importerSlug &&
        countrySlugSet.has(exporterSlug) &&
        countrySlugSet.has(importerSlug);
      const laneId = `${exporter}→${importer}`;
      const existing = laneCounts.get(laneId) ?? {
        exporter,
        importer,
        exporterSlug,
        importerSlug,
        compareHref: hasCompareCountries
          ? `/compare?leftCountry=${exporterSlug}&rightCountry=${importerSlug}`
          : null,
        flowCount: 0,
        categories: new Set<string>(),
        products: [],
        linkedMaterials: new Set<string>(),
        matchedFlowCount: 0,
      };

      const matchedMaterial =
        rawMaterials.find((material) => {
          const materialName = material.name.toLowerCase();
          const normalizedFlowProduct = flow.product.toLowerCase();

          return (
            normalizedFlowProduct.includes(materialName) ||
            materialName.includes(normalizedFlowProduct)
          );
        }) ?? null;

      existing.flowCount += 1;
      existing.categories.add(flow.category);
      existing.products.push(flow.product);
      if (matchedMaterial) {
        existing.linkedMaterials.add(matchedMaterial.slug);
        existing.matchedFlowCount += 1;
      }
      laneCounts.set(laneId, existing);
    }

    return Array.from(laneCounts.values())
      .map((lane) => ({
        ...lane,
        categories: Array.from(lane.categories).sort((a, b) => a.localeCompare(b)),
        products: Array.from(new Set(lane.products)).sort((a, b) => a.localeCompare(b)),
        linkedMaterialRecords: Array.from(lane.linkedMaterials)
          .map((slug) => rawMaterials.find((material) => material.slug === slug) ?? null)
          .filter((material): material is (typeof rawMaterials)[number] => material !== null)
          .sort((a, b) => a.name.localeCompare(b.name)),
        laneShare: filtered.length > 0 ? (lane.flowCount / filtered.length) * 100 : 0,
        materialCoverageShare:
          lane.flowCount > 0 ? (lane.matchedFlowCount / lane.flowCount) * 100 : 0,
      }))
      .sort((a, b) => b.flowCount - a.flowCount || a.exporter.localeCompare(b.exporter))
      .slice(0, 10);
  }, [countrySlugSet, filtered]);

  const primaryExchangeCoverageGaps = useMemo(() => {
    return [...primaryExchangeLanes]
      .sort(
        (a, b) => a.materialCoverageShare - b.materialCoverageShare || b.flowCount - a.flowCount
      )
      .slice(0, 5);
  }, [primaryExchangeLanes]);

  const exchangeDecisionQueue = useMemo(() => {
    return primaryExchangeLanes
      .map((lane) => {
        const coverageGap = Math.max(0, 100 - lane.materialCoverageShare);
        const impactScore = lane.laneShare * coverageGap;

        return {
          ...lane,
          coverageGap,
          impactScore,
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore || b.flowCount - a.flowCount)
      .slice(0, 5);
  }, [primaryExchangeLanes]);

  const exchangeCoverageSnapshot = useMemo(() => {
    const laneCount = primaryExchangeLanes.length;

    const fullCoverage = primaryExchangeLanes.filter(
      (lane) => lane.materialCoverageShare >= 100
    ).length;
    const partialCoverage = primaryExchangeLanes.filter(
      (lane) => lane.materialCoverageShare > 0 && lane.materialCoverageShare < 100
    ).length;
    const noCoverage = primaryExchangeLanes.filter(
      (lane) => lane.materialCoverageShare <= 0
    ).length;

    return {
      laneCount,
      fullCoverage,
      partialCoverage,
      noCoverage,
      fullCoverageShare: laneCount > 0 ? (fullCoverage / laneCount) * 100 : 0,
      noCoverageShare: laneCount > 0 ? (noCoverage / laneCount) * 100 : 0,
    };
  }, [primaryExchangeLanes]);

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

          <label>
            Material dataset link
            <select
              value={materialLinkMode}
              onChange={(e) => setMaterialLinkMode(e.target.value as MaterialLinkMode)}
            >
              <option value="all">All routes</option>
              <option value="linked">Only routes linked to materials</option>
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
              setMaterialLinkMode("all");
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
            {materialLinkMode !== "all" ? (
              <button
                type="button"
                className="activeFilterChip"
                onClick={() => setMaterialLinkMode("all")}
              >
                Material links only ×
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
            materialLinkMode === "all" &&
            sortMode === "relevance" ? (
              <span className="sectionIntro">None</span>
            ) : null}
          </div>
        </div>
      </Card>

      <Card
        title="Map → exchange workflow"
        subtitle="Use this sequence to move from route discovery to material-level decisions faster."
      >
        <ol className="miniList">
          <li>
            <strong>1) Focus the map</strong>: Pick a country and role to isolate relevant
            corridors.
          </li>
          <li>
            <strong>2) Prioritize exchange lanes</strong>: Use flow share in primary lanes to
            identify the highest-impact exporter → importer pairs first.
          </li>
          <li>
            <strong>3) Validate material coverage</strong>: Open linked material pages to confirm
            extraction and processing context before finalizing route decisions.
          </li>
        </ol>
        <div className="filterActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() => setMaterialLinkMode("linked")}
          >
            Show only routes linked to material datasets
          </button>
          <button
            type="button"
            className="secondaryButton"
            onClick={() => setCountryRole("exporter")}
          >
            Focus exporter-side pressure points
          </button>
        </div>
      </Card>

      <Card
        title="Importers and exporters summary"
        subtitle="Top countries in the current filtered view."
      >
        <StatGrid>
          <StatCard label="Matching flows" value={String(filtered.length)} />
          <StatCard
            label="Routes linked to material datasets"
            value={String(materialLinkedFlowCount)}
          />
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

      <Card
        title="Country role leaderboard"
        subtitle="Importer/exporter appearance by country in the current filtered flow set, with direct country drilldowns."
      >
        {countryRoleLeaderboard.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Importer appearances</th>
                  <th>Exporter appearances</th>
                  <th>Total role appearances</th>
                  <th>Drilldowns</th>
                </tr>
              </thead>
              <tbody>
                {countryRoleLeaderboard.map((row) => {
                  const compareRightSlug =
                    row.slug === fallbackCompareSlug
                      ? (countryProfiles.find((profile) => profile.slug !== row.slug)?.slug ??
                        fallbackCompareSlug)
                      : fallbackCompareSlug;
                  const compareHref = row.hasDetailPage
                    ? `/compare?leftCountry=${row.slug}&rightCountry=${compareRightSlug}`
                    : null;

                  return (
                    <tr key={`leaderboard-${row.name}`}>
                      <td>{row.name}</td>
                      <td>
                        {row.importerCount} ({row.importerShare.toFixed(0)}%)
                      </td>
                      <td>
                        {row.exporterCount} ({row.exporterShare.toFixed(0)}%)
                      </td>
                      <td>{row.totalCount}</td>
                      <td>
                        {row.hasDetailPage ? (
                          <>
                            <Link href={`/countries/${row.slug}`}>Country</Link>
                            {" · "}
                            <Link href={compareHref ?? "/compare"}>Compare</Link>
                          </>
                        ) : (
                          "No country page yet"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No country role rows for the current filters.</p>
        )}
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

          <p className="sectionIntro">
            <Link href={`/countries/${toCountrySlug(countrySpotlight.name)}`}>
              Open full country detail →
            </Link>
          </p>

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
              <>
                <p className="sectionIntro">
                  Spotlight: <strong>{selectedRoute.product}</strong> ·{" "}
                  {selectedRoute.stops.join(" → ")}
                </p>
                {selectedRoute.topExporter && selectedRoute.topImporter ? (
                  <p className="sectionIntro">
                    Primary exchange pair: <strong>{selectedRoute.topExporter}</strong> (exporter) →{" "}
                    <strong>{selectedRoute.topImporter}</strong> (importer)
                  </p>
                ) : null}
                {selectedRoute.matchedMaterial ? (
                  <p className="sectionIntro">
                    Related raw-material dataset:{" "}
                    <Link href={`/materials/${selectedRoute.matchedMaterial.slug}`}>
                      {selectedRoute.matchedMaterial.name}
                    </Link>
                  </p>
                ) : null}
                {selectedRoute.compareHref &&
                selectedRoute.topExporter &&
                selectedRoute.topImporter ? (
                  <p className="sectionIntro">
                    Compare primary route countries:{" "}
                    <Link href={selectedRoute.compareHref}>{selectedRoute.topExporter}</Link> vs{" "}
                    <Link href={selectedRoute.compareHref}>{selectedRoute.topImporter}</Link>
                  </p>
                ) : null}
              </>
            ) : null}

            <RouteMap
              routes={mappedRoutes}
              selectedRouteId={selectedRouteId}
              selectedCountry={country === "All countries" ? null : country}
            />
          </>
        ) : (
          <p className="sectionIntro">No mappable routes for the current filters.</p>
        )}
      </Card>

      <Card
        title="Exchange clarity snapshot"
        subtitle="Quickly see how many high-frequency lanes are fully supported by material datasets versus where evidence is missing."
      >
        <StatGrid>
          <StatCard
            label="Primary lanes in view"
            value={String(exchangeCoverageSnapshot.laneCount)}
          />
          <StatCard
            label="Lanes with full material coverage"
            value={`${exchangeCoverageSnapshot.fullCoverage} (${exchangeCoverageSnapshot.fullCoverageShare.toFixed(0)}%)`}
          />
          <StatCard
            label="Lanes with partial coverage"
            value={String(exchangeCoverageSnapshot.partialCoverage)}
          />
          <StatCard
            label="Lanes with no direct material linkage"
            value={`${exchangeCoverageSnapshot.noCoverage} (${exchangeCoverageSnapshot.noCoverageShare.toFixed(0)}%)`}
          />
        </StatGrid>
        <p className="sectionIntro">
          Use this snapshot to decide whether to prioritize route optimization (high full coverage)
          or material-data expansion (high no-coverage share).
        </p>
      </Card>

      <Card
        title="Primary exchange lanes"
        subtitle="Most repeated exporter → importer country pairs across the active filtered routes, including flow share and linked raw-material datasets."
      >
        {primaryExchangeLanes.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Exporter</th>
                  <th>Importer</th>
                  <th>Matched flows</th>
                  <th>Flow share</th>
                  <th>Material coverage</th>
                  <th>Categories</th>
                  <th>Sample products</th>
                  <th>Linked materials</th>
                  <th>Drilldowns</th>
                </tr>
              </thead>
              <tbody>
                {primaryExchangeLanes.map((lane) => (
                  <tr key={`lane-${lane.exporterSlug}-${lane.importerSlug}`}>
                    <td>
                      {countrySlugSet.has(lane.exporterSlug) ? (
                        <Link href={`/countries/${lane.exporterSlug}`}>{lane.exporter}</Link>
                      ) : (
                        lane.exporter
                      )}
                    </td>
                    <td>
                      {countrySlugSet.has(lane.importerSlug) ? (
                        <Link href={`/countries/${lane.importerSlug}`}>{lane.importer}</Link>
                      ) : (
                        lane.importer
                      )}
                    </td>
                    <td>{lane.flowCount}</td>
                    <td>{lane.laneShare.toFixed(0)}%</td>
                    <td>
                      {lane.matchedFlowCount} / {lane.flowCount} (
                      {lane.materialCoverageShare.toFixed(0)}%)
                    </td>
                    <td>{lane.categories.join(", ")}</td>
                    <td>{lane.products.slice(0, 3).join(", ")}</td>
                    <td>
                      {lane.linkedMaterialRecords.length > 0
                        ? lane.linkedMaterialRecords.map((material, index) => (
                            <span
                              key={`${lane.exporterSlug}-${lane.importerSlug}-${material.slug}`}
                            >
                              {index > 0 ? ", " : ""}
                              <Link href={`/materials/${material.slug}`}>{material.name}</Link>
                            </span>
                          ))
                        : "No direct material match"}
                    </td>
                    <td>
                      {lane.compareHref ? (
                        <Link href={lane.compareHref}>
                          Compare {lane.exporter} vs {lane.importer}
                        </Link>
                      ) : (
                        "Compare unavailable"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No exchange lanes available for the current filters.</p>
        )}
      </Card>

      <Card
        title="Material coverage gaps in primary lanes"
        subtitle="Highlight high-traffic exporter → importer lanes where material-level evidence is thin, so map insights can be validated before decisions."
      >
        {primaryExchangeCoverageGaps.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Matched flows</th>
                  <th>Material coverage</th>
                  <th>Next step</th>
                </tr>
              </thead>
              <tbody>
                {primaryExchangeCoverageGaps.map((lane) => (
                  <tr key={`coverage-gap-${lane.exporterSlug}-${lane.importerSlug}`}>
                    <td>
                      {lane.exporter} → {lane.importer}
                    </td>
                    <td>
                      {lane.matchedFlowCount} / {lane.flowCount}
                    </td>
                    <td>{lane.materialCoverageShare.toFixed(0)}%</td>
                    <td>
                      {lane.linkedMaterialRecords.length > 0
                        ? lane.linkedMaterialRecords.map((material, index) => (
                            <span key={`coverage-material-${lane.exporterSlug}-${material.slug}`}>
                              {index > 0 ? ", " : ""}
                              <Link href={`/materials/${material.slug}`}>{material.name}</Link>
                            </span>
                          ))
                        : "No linked materials yet — prioritize data expansion"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No primary lanes available for coverage analysis.</p>
        )}
      </Card>

      <Card
        title="Lane decision queue"
        subtitle="Prioritize exporter → importer lanes where map impact is high and material evidence is thin, then jump directly into a focused route view."
      >
        {exchangeDecisionQueue.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Priority lane</th>
                  <th>Flow share</th>
                  <th>Material coverage</th>
                  <th>Coverage gap</th>
                  <th>Priority score</th>
                  <th>Action bundle</th>
                  <th>Focus workflow</th>
                </tr>
              </thead>
              <tbody>
                {exchangeDecisionQueue.map((lane) => (
                  <tr key={`decision-queue-${lane.exporterSlug}-${lane.importerSlug}`}>
                    <td>
                      {lane.exporter} → {lane.importer}
                    </td>
                    <td>{lane.laneShare.toFixed(0)}%</td>
                    <td>{lane.materialCoverageShare.toFixed(0)}%</td>
                    <td>{lane.coverageGap.toFixed(0)}%</td>
                    <td>{lane.impactScore.toFixed(0)}</td>
                    <td>
                      {lane.compareHref ? (
                        <Link href={lane.compareHref}>Compare countries</Link>
                      ) : null}
                      {lane.compareHref && lane.linkedMaterialRecords.length > 0 ? " · " : null}
                      {lane.linkedMaterialRecords.length > 0
                        ? lane.linkedMaterialRecords.slice(0, 2).map((material, index) => (
                            <span
                              key={`decision-lane-material-${lane.exporterSlug}-${material.slug}`}
                            >
                              {index > 0 ? ", " : ""}
                              <Link href={`/materials/${material.slug}`}>{material.name}</Link>
                            </span>
                          ))
                        : "No linked materials yet"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondaryButton"
                        onClick={() => {
                          setCountry(lane.importer);
                          setCountryRole("importer");
                          setMaterialLinkMode("linked");
                          setQuery(lane.products[0] ?? "");
                          setSortMode("relevance");
                          setViewMode("cards");
                          setPage(1);
                        }}
                      >
                        Focus importer lane
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No lanes available for decision queue prioritization.</p>
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
