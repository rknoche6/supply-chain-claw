import Link from "next/link";
import { Card, Container, Pill, SectionHeader } from "../components";
import { rawMaterials } from "../../lib/raw-materials";

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

export default function MethodologyPage() {
  const sources = getUniqueSources();
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
