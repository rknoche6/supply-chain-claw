import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../../components";
import { getCountryBySlug, getCountryProfiles } from "../../../lib/countries";

type CountryPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getCountryProfiles().map((country) => ({ slug: country.slug }));
}

export default function CountryDetailPage({ params }: CountryPageProps) {
  const country = getCountryBySlug(params.slug);

  if (!country) {
    notFound();
  }

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Country detail</Pill>
        <h1>{country.name}</h1>
        <p>Role breakdown and partner drilldown from the current explorer trade-flow dataset.</p>
        <p>
          <Link href="/">← Back to explorer</Link>
        </p>
      </header>

      <Card>
        <SectionHeader
          eyebrow="Country role summary"
          title="Importer/exporter participation"
          description="Counts are based on the products currently captured in the explorer dataset."
        />
        <StatGrid>
          <StatCard label="Importer roles" value={String(country.roleBreakdown.importerCount)} />
          <StatCard label="Exporter roles" value={String(country.roleBreakdown.exporterCount)} />
          <StatCard label="Unique products" value={String(country.roleBreakdown.totalFlows)} />
          <StatCard label="Top partners listed" value={String(country.topPartners.length)} />
          <StatCard label="Material records" value={String(country.materialRecords.length)} />
          <StatCard
            label="High-confidence material records"
            value={String(
              country.materialRecords.filter((record) => record.confidence === "High").length
            )}
          />
        </StatGrid>
      </Card>

      <Card
        title="Partner concentration"
        subtitle="Most frequent counterparties by shared product flow and role context."
      >
        {country.topPartners.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Partner country</th>
                  <th>Shared flows</th>
                  <th>Context</th>
                </tr>
              </thead>
              <tbody>
                {country.topPartners.map((partner) => (
                  <tr key={`${country.slug}-${partner.role}-${partner.name}`}>
                    <td>{partner.name}</td>
                    <td>{partner.sharedFlows}</td>
                    <td>
                      {partner.role === "import-partner" ? "When importing" : "When exporting"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No partner data available for this country yet.</p>
        )}
      </Card>

      <Card
        title="Source-cited material records"
        subtitle="Exact numeric records linked to this country with units, year, freshness, and confidence."
      >
        {country.materialRecords.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Year</th>
                  <th>Freshness</th>
                  <th>Confidence</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {country.materialRecords.map((record) => (
                  <tr
                    key={`${country.slug}-${record.materialSlug}-${record.metric}-${record.year}-${record.value}`}
                  >
                    <td>
                      <Link href={`/materials/${record.materialSlug}`}>{record.materialName}</Link>
                    </td>
                    <td>{record.category}</td>
                    <td>{record.metric}</td>
                    <td>
                      {record.value.toLocaleString()} {record.unit}
                    </td>
                    <td>{record.year}</td>
                    <td>{record.freshness}</td>
                    <td>{record.confidence}</td>
                    <td>
                      <a href={record.sourceUrl} target="_blank" rel="noreferrer">
                        {record.sourceName}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No source-cited material records for this country yet.</p>
        )}
      </Card>

      <Card
        title="Product participation"
        subtitle="Each row shows where this country appears and the route currently represented."
      >
        {country.products.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Role</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                {country.products.map((item) => (
                  <tr key={`${country.slug}-${item.role}-${item.product}`}>
                    <td>{item.product}</td>
                    <td>{item.category}</td>
                    <td>{item.role}</td>
                    <td>{item.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No product records for this country yet.</p>
        )}
      </Card>
    </Container>
  );
}
