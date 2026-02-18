import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../../components";
import { getCountryProfiles, toCountrySlug } from "../../../lib/countries";
import {
  getDataPointConfidence,
  getFreshnessLabel,
  getMaterialBySlug,
  rawMaterials,
} from "../../../lib/raw-materials";

type MaterialPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    year?: string;
    confidence?: string;
    country?: string;
  };
};

export function generateStaticParams() {
  return rawMaterials.map((item) => ({ slug: item.slug }));
}

export default function MaterialDetailPage({ params, searchParams }: MaterialPageProps) {
  const material = getMaterialBySlug(params.slug);

  if (!material) {
    notFound();
  }

  const selectedYear = searchParams?.year ?? "all";
  const selectedConfidence = searchParams?.confidence ?? "all";
  const countryQuery = (searchParams?.country ?? "").trim().toLowerCase();

  const filteredPoints = material.dataPoints.filter((point) => {
    const confidence = getDataPointConfidence(point);
    const yearMatch = selectedYear === "all" || String(point.year) === selectedYear;
    const confidenceMatch = selectedConfidence === "all" || confidence === selectedConfidence;
    const countryMatch =
      countryQuery.length === 0 || point.country.toLowerCase().includes(countryQuery);

    return yearMatch && confidenceMatch && countryMatch;
  });

  const sortedPoints = [...material.dataPoints].sort((a, b) => b.value - a.value);
  const filteredSortedPoints = [...filteredPoints].sort((a, b) => b.value - a.value);
  const topPoint = sortedPoints[0];
  const totalValue = sortedPoints.reduce((sum, point) => sum + point.value, 0);
  const topThreeValue = sortedPoints.slice(0, 3).reduce((sum, point) => sum + point.value, 0);
  const topThreeShare = totalValue > 0 ? (topThreeValue / totalValue) * 100 : 0;
  const hhi =
    totalValue > 0
      ? sortedPoints.reduce((sum, point) => {
          const share = point.value / totalValue;
          return sum + share * share * 10000;
        }, 0)
      : 0;
  const concentrationBand = hhi >= 2500 ? "High" : hhi >= 1500 ? "Moderate" : "Low";

  const availableYears = Array.from(new Set(material.dataPoints.map((point) => point.year))).sort(
    (a, b) => b - a
  );
  const primaryMetric = material.dataPoints[0]?.metric ?? null;
  const primaryUnit = material.dataPoints[0]?.unit ?? null;
  const highConfidenceCount = material.dataPoints.filter(
    (point) => getDataPointConfidence(point) === "High"
  ).length;
  const countrySlugSet = new Set(getCountryProfiles().map((country) => country.slug));
  const currentOrRecentCount = material.dataPoints.filter((point) => {
    const freshness = getFreshnessLabel(point.year, material.updatedAt);
    return freshness === "Current" || freshness === "Recent";
  }).length;

  const yearlyTrend = availableYears
    .map((year) => {
      const yearPoints = material.dataPoints.filter((point) => point.year === year);
      const total = yearPoints.reduce((sum, point) => sum + point.value, 0);
      const highConfidence = yearPoints.filter(
        (point) => getDataPointConfidence(point) === "High"
      ).length;

      return {
        year,
        total,
        recordCount: yearPoints.length,
        highConfidence,
        sourceCount: new Set(yearPoints.map((point) => point.sourceUrl)).size,
      };
    })
    .sort((a, b) => b.year - a.year)
    .map((entry, index, arr) => {
      const previousYear = arr[index + 1];
      const yoyDelta = previousYear ? entry.total - previousYear.total : null;
      const yoyDeltaPercent =
        previousYear && previousYear.total !== 0 && yoyDelta !== null
          ? (yoyDelta / previousYear.total) * 100
          : null;

      return {
        ...entry,
        yoyDelta,
        yoyDeltaPercent,
      };
    });

  const yearlySources = availableYears
    .map((year) => {
      const yearPoints = material.dataPoints.filter((point) => point.year === year);
      const sources = Array.from(
        yearPoints
          .reduce((map, point) => {
            const key = `${point.sourceName}::${point.sourceUrl}`;
            const existing = map.get(key);

            if (existing) {
              existing.records += 1;
            } else {
              map.set(key, {
                sourceName: point.sourceName,
                sourceUrl: point.sourceUrl,
                records: 1,
              });
            }

            return map;
          }, new Map<string, { sourceName: string; sourceUrl: string; records: number }>())
          .values()
      ).sort((a, b) => b.records - a.records || a.sourceName.localeCompare(b.sourceName));

      return {
        year,
        countryCount: new Set(yearPoints.map((point) => point.country)).size,
        recordCount: yearPoints.length,
        sources,
      };
    })
    .sort((a, b) => b.year - a.year);

  const compareMaterialShortcuts = rawMaterials
    .filter(
      (candidate) => candidate.slug !== material.slug && candidate.category === material.category
    )
    .map((candidate) => {
      const candidatePrimaryMetric = candidate.dataPoints[0]?.metric ?? null;
      const candidatePrimaryUnit = candidate.dataPoints[0]?.unit ?? null;
      const directlyComparable =
        primaryMetric !== null &&
        primaryUnit !== null &&
        candidatePrimaryMetric === primaryMetric &&
        candidatePrimaryUnit === primaryUnit;

      return {
        slug: candidate.slug,
        name: candidate.name,
        recordCount: candidate.dataPoints.length,
        directlyComparable,
      };
    })
    .sort(
      (a, b) =>
        Number(b.directlyComparable) - Number(a.directlyComparable) ||
        b.recordCount - a.recordCount ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 6);

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Material detail</Pill>
        <h1>{material.name}</h1>
        <p>{material.notes}</p>
        <p>
          <Link href="/">← Back to explorer</Link>
        </p>
      </header>

      <Card>
        <SectionHeader
          eyebrow="Data quality"
          title="Exact values, units, years, and source citations"
          description="Each record includes a numeric value, explicit unit, reference year, and source URL."
        />

        <StatGrid>
          <StatCard label="Category" value={material.category} />
          <StatCard label="Records" value={String(material.dataPoints.length)} />
          <StatCard label="Years covered" value={availableYears.join(", ")} />
          <StatCard label="High-confidence records" value={String(highConfidenceCount)} />
          <StatCard label="Current/recent records" value={String(currentOrRecentCount)} />
          <StatCard label="Last updated" value={material.updatedAt} />
        </StatGrid>

        <div className="spotlightGrid">
          <article className="statCard">
            <p className="statLabel">Top producer in dataset</p>
            <p className="statValue">
              {topPoint.country}: {topPoint.value.toLocaleString()} {topPoint.unit}
            </p>
            <p className="statHint">Year {topPoint.year}</p>
          </article>
          <article className="statCard">
            <p className="statLabel">Top 3 producer share</p>
            <p className="statValue">{topThreeShare.toFixed(1)}%</p>
            <p className="statHint">Share of captured value held by the top three countries.</p>
          </article>
          <article className="statCard">
            <p className="statLabel">Concentration (HHI)</p>
            <p className="statValue">
              {Math.round(hhi).toLocaleString()} · {concentrationBand}
            </p>
            <p className="statHint">Higher values indicate tighter producer concentration.</p>
          </article>
          <article className="statCard">
            <p className="statLabel">Filtered country records</p>
            <p className="statValue">{filteredPoints.length}</p>
            <p className="statHint">Current table scope after year/confidence/country filters.</p>
          </article>
        </div>
      </Card>

      <Card
        title="Compare shortcuts"
        subtitle="Launch prefilled material comparisons from this detail page."
      >
        <p className="sectionIntro">
          Baseline: <strong>{material.name}</strong> as the left material in compare view.
        </p>
        {compareMaterialShortcuts.length > 0 ? (
          <div className="linkChipList">
            {compareMaterialShortcuts.map((candidate) => {
              const compareParams = new URLSearchParams({
                leftMaterial: material.slug,
                rightMaterial: candidate.slug,
              });

              return (
                <Link
                  key={`${material.slug}-compare-${candidate.slug}`}
                  href={`/compare?${compareParams.toString()}`}
                  className="linkChip"
                >
                  <span>
                    {material.name} vs {candidate.name}
                  </span>
                  <span>
                    {candidate.directlyComparable ? "Directly comparable" : "Open compare"}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="sectionIntro">
            No mapped material peers available yet for quick compare links.
          </p>
        )}
      </Card>

      <Card
        title="Yearly trend coverage"
        subtitle="Year totals, year-over-year movement, and confidence density in the captured records."
      >
        <div className="tableWrap">
          <table className="flowTable">
            <thead>
              <tr>
                <th>Year</th>
                <th>Total captured value</th>
                <th>YoY delta</th>
                <th>Records</th>
                <th>High-confidence records</th>
                <th>Source links</th>
              </tr>
            </thead>
            <tbody>
              {yearlyTrend.map((entry) => (
                <tr key={`${material.slug}-trend-${entry.year}`}>
                  <td>{entry.year}</td>
                  <td>
                    {entry.total.toLocaleString()} {topPoint.unit}
                  </td>
                  <td>
                    {entry.yoyDelta === null ? (
                      "Baseline"
                    ) : (
                      <>
                        {entry.yoyDelta >= 0 ? "+" : ""}
                        {entry.yoyDelta.toLocaleString()} {topPoint.unit}
                        {entry.yoyDeltaPercent !== null
                          ? ` (${entry.yoyDeltaPercent >= 0 ? "+" : ""}${entry.yoyDeltaPercent.toFixed(1)}%)`
                          : ""}
                      </>
                    )}
                  </td>
                  <td>{entry.recordCount}</td>
                  <td>{entry.highConfidence}</td>
                  <td>{entry.sourceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Year-by-year citation coverage"
        subtitle="Source links used per year so data provenance is inspectable without leaving the material page."
      >
        <div className="tableWrap">
          <table className="flowTable">
            <thead>
              <tr>
                <th>Year</th>
                <th>Countries in dataset</th>
                <th>Records</th>
                <th>Source citations</th>
              </tr>
            </thead>
            <tbody>
              {yearlySources.map((entry) => (
                <tr key={`${material.slug}-sources-${entry.year}`}>
                  <td>{entry.year}</td>
                  <td>{entry.countryCount}</td>
                  <td>{entry.recordCount}</td>
                  <td>
                    <ul className="miniList">
                      {entry.sources.map((source) => (
                        <li key={`${entry.year}-${source.sourceName}-${source.sourceUrl}`}>
                          <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                            {source.sourceName}
                          </a>{" "}
                          ({source.records})
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Country records"
        subtitle="Sorted by value for fast exporter concentration review."
      >
        <form method="get" className="filterActions" style={{ marginBottom: "0.75rem" }}>
          <label>
            Year
            <select name="year" defaultValue={selectedYear}>
              <option value="all">All years</option>
              {availableYears.map((year) => (
                <option key={`${material.slug}-filter-year-${year}`} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            Confidence
            <select name="confidence" defaultValue={selectedConfidence}>
              <option value="all">All confidence levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label>
            Country search
            <input
              type="search"
              name="country"
              defaultValue={searchParams?.country ?? ""}
              placeholder="Filter countries"
            />
          </label>

          <button type="submit" className="secondaryButton">
            Apply filters
          </button>
          <Link href={`/materials/${material.slug}`} className="secondaryButton" prefetch={false}>
            Reset
          </Link>
        </form>

        <p className="sectionIntro">
          Showing {filteredSortedPoints.length} of {material.dataPoints.length} records.
        </p>

        <div className="tableWrap">
          <table className="flowTable">
            <thead>
              <tr>
                <th>Country</th>
                <th>Metric</th>
                <th>Value</th>
                <th>Year</th>
                <th>Freshness</th>
                <th>Confidence</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortedPoints.map((point) => {
                const freshness = getFreshnessLabel(point.year, material.updatedAt);
                const confidence = getDataPointConfidence(point);
                const countrySlug = toCountrySlug(point.country);
                const hasCountryPage = countrySlugSet.has(countrySlug);

                return (
                  <tr key={`${material.slug}-${point.country}-${point.metric}-${point.year}`}>
                    <td>
                      {hasCountryPage ? (
                        <Link href={`/countries/${countrySlug}`}>{point.country}</Link>
                      ) : (
                        point.country
                      )}
                    </td>
                    <td>{point.metric}</td>
                    <td>
                      {point.value.toLocaleString()} {point.unit}
                    </td>
                    <td>{point.year}</td>
                    <td>{freshness}</td>
                    <td>{confidence}</td>
                    <td>
                      <a href={point.sourceUrl} target="_blank" rel="noreferrer">
                        {point.sourceName}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSortedPoints.length === 0 ? (
          <p className="sectionIntro">
            No country records match the current filters. Try broader year/confidence settings.
          </p>
        ) : null}
      </Card>
    </Container>
  );
}
