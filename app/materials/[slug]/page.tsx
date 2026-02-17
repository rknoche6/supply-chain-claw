import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../../components";
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
};

export function generateStaticParams() {
  return rawMaterials.map((item) => ({ slug: item.slug }));
}

export default function MaterialDetailPage({ params }: MaterialPageProps) {
  const material = getMaterialBySlug(params.slug);

  if (!material) {
    notFound();
  }

  const sortedPoints = [...material.dataPoints].sort((a, b) => b.value - a.value);
  const topPoint = sortedPoints[0];
  const availableYears = Array.from(new Set(material.dataPoints.map((point) => point.year))).sort(
    (a, b) => b - a
  );
  const highConfidenceCount = material.dataPoints.filter(
    (point) => getDataPointConfidence(point) === "High"
  ).length;
  const currentOrRecentCount = material.dataPoints.filter((point) => {
    const freshness = getFreshnessLabel(point.year, material.updatedAt);
    return freshness === "Current" || freshness === "Recent";
  }).length;

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
            <p className="statLabel">Trend status</p>
            <p className="statValue">Single-year snapshot</p>
            <p className="statHint">Add multi-year points to unlock trend lines.</p>
          </article>
        </div>
      </Card>

      <Card
        title="Country records"
        subtitle="Sorted by value for fast exporter concentration review."
      >
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
              {sortedPoints.map((point) => {
                const freshness = getFreshnessLabel(point.year, material.updatedAt);
                const confidence = getDataPointConfidence(point);

                return (
                  <tr key={`${material.slug}-${point.country}-${point.metric}-${point.year}`}>
                    <td>{point.country}</td>
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
      </Card>
    </Container>
  );
}
