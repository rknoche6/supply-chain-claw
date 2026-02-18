import Link from "next/link";
import { Card, Container, Pill, SectionHeader } from "../components";
import { getFreshnessLabel, rawMaterials } from "../../lib/raw-materials";

const confidenceScale = [
  {
    label: "High",
    definition:
      "Official primary-source datasets with exact numeric values, unit, year, and direct source URL.",
  },
  {
    label: "Medium",
    definition:
      "Credible institutional source with clear value and year, but with minor methodology ambiguity.",
  },
  {
    label: "Low",
    definition:
      "Partial, inferred, or outdated values. Low-confidence records should be excluded from explorer UI by default.",
  },
] as const;

function getUniqueSources() {
  const map = new Map<string, { name: string; url: string; records: number }>();

  for (const material of rawMaterials) {
    for (const point of material.dataPoints) {
      const key = `${point.sourceName}::${point.sourceUrl}`;
      const existing = map.get(key);

      if (existing) {
        existing.records += 1;
      } else {
        map.set(key, { name: point.sourceName, url: point.sourceUrl, records: 1 });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.records - a.records || a.name.localeCompare(b.name)
  );
}

function getFreshnessSummary() {
  return rawMaterials
    .map((material) => {
      const years = material.dataPoints.map((point) => point.year);
      const counts = material.dataPoints.reduce(
        (acc, point) => {
          const freshness = getFreshnessLabel(point.year, material.updatedAt);
          acc.total += 1;

          if (freshness === "Current" || freshness === "Recent" || freshness === "Stale") {
            acc[freshness] += 1;
          }

          return acc;
        },
        { total: 0, Current: 0, Recent: 0, Stale: 0 }
      );

      return {
        materialName: material.name,
        materialSlug: material.slug,
        latestYear: years.length > 0 ? Math.max(...years) : null,
        oldestYear: years.length > 0 ? Math.min(...years) : null,
        ...counts,
      };
    })
    .sort((a, b) => a.materialName.localeCompare(b.materialName));
}

export default function MethodologyPage() {
  const sources = getUniqueSources();
  const freshnessSummary = getFreshnessSummary();
  const latestUpdate = rawMaterials
    .map((item) => item.updatedAt)
    .sort((a, b) => b.localeCompare(a))[0];

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Methodology</Pill>
        <h1>Data sourcing and confidence rules</h1>
        <p>
          Explorer views prioritize precise numeric records with explicit unit, year, and source
          links. Vague estimates are excluded from the main UI.
        </p>
        <p>
          <Link href="/">← Back to explorer</Link>
        </p>
      </header>

      <Card>
        <SectionHeader
          eyebrow="Quality gate"
          title="Inclusion criteria"
          description="Records must satisfy all required fields before appearing in explorer tables and detail pages."
        />
        <ul>
          <li>Numeric value present (no ranges like about, ~, or unknown).</li>
          <li>Explicit measurement unit (e.g., tonnes, kg, USD, share %).</li>
          <li>Reference year included as a number.</li>
          <li>Direct source citation URL and source name.</li>
        </ul>
      </Card>

      <Card title="Confidence scale" subtitle="Assigned per record as the dataset expands.">
        <div className="flowList">
          {confidenceScale.map((level) => (
            <article key={level.label} className="flowCard">
              <p className="flowCategory">{level.label}</p>
              <p>{level.definition}</p>
            </article>
          ))}
        </div>
      </Card>

      <Card
        title="Freshness rules"
        subtitle="Records are labeled by age relative to each material dataset’s latest update year."
      >
        <ul>
          <li>
            <strong>Current:</strong> reference year is within 1 year of the material’s latest
            update year.
          </li>
          <li>
            <strong>Recent:</strong> reference year is 2-3 years behind the latest update year.
          </li>
          <li>
            <strong>Stale:</strong> reference year is 4+ years behind and should be reviewed before
            decision use.
          </li>
        </ul>
      </Card>

      <Card
        title="Dataset freshness by material"
        subtitle="Counts of Current/Recent/Stale rows, plus oldest and latest reference year by material."
      >
        <div className="tableWrap">
          <table className="flowTable">
            <thead>
              <tr>
                <th>Material</th>
                <th>Total records</th>
                <th>Current</th>
                <th>Recent</th>
                <th>Stale</th>
                <th>Year span</th>
              </tr>
            </thead>
            <tbody>
              {freshnessSummary.map((row) => (
                <tr key={row.materialSlug}>
                  <td>
                    <Link href={`/materials/${row.materialSlug}`}>{row.materialName}</Link>
                  </td>
                  <td>{row.total}</td>
                  <td>{row.Current}</td>
                  <td>{row.Recent}</td>
                  <td>{row.Stale}</td>
                  <td>
                    {row.oldestYear ?? "—"}
                    {row.oldestYear && row.latestYear && row.oldestYear !== row.latestYear
                      ? ` → ${row.latestYear}`
                      : row.latestYear
                        ? ` (${row.latestYear})`
                        : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Source coverage"
        subtitle={`Unique sources currently used in raw-material records · latest dataset update ${latestUpdate}`}
      >
        <div className="tableWrap">
          <table className="flowTable">
            <thead>
              <tr>
                <th>Source</th>
                <th>Records</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={`${source.name}-${source.url}`}>
                  <td>{source.name}</td>
                  <td>{source.records}</td>
                  <td>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}
