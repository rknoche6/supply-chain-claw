import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../../components";
import { getCountryBySlug, getCountryProfiles } from "../../../lib/countries";

type CountryPageProps = {
  params: {
    slug: string;
  };
};

type PartnerConcentration = {
  total: number;
  topShare: number;
  hhi: number;
  riskBand: "High" | "Moderate" | "Low";
};

function getPartnerConcentration(sharedFlows: number[]): PartnerConcentration {
  const total = sharedFlows.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return {
      total: 0,
      topShare: 0,
      hhi: 0,
      riskBand: "Low",
    };
  }

  const topShare = (Math.max(...sharedFlows) / total) * 100;
  const hhi = sharedFlows.reduce((sum, value) => {
    const share = value / total;
    return sum + share * share * 10000;
  }, 0);

  const riskBand = hhi >= 2500 ? "High" : hhi >= 1500 ? "Moderate" : "Low";

  return {
    total,
    topShare,
    hhi,
    riskBand,
  };
}

export function generateStaticParams() {
  return getCountryProfiles().map((country) => ({ slug: country.slug }));
}

export default function CountryDetailPage({ params }: CountryPageProps) {
  const country = getCountryBySlug(params.slug);

  if (!country) {
    notFound();
  }

  const partnerSlugByName = new Map(
    getCountryProfiles().map((profile) => [profile.name, profile.slug])
  );

  const importPartners = country.topPartners.filter((partner) => partner.role === "import-partner");
  const exportPartners = country.topPartners.filter((partner) => partner.role === "export-partner");
  const importConcentration = getPartnerConcentration(
    importPartners.map((partner) => partner.sharedFlows)
  );
  const exportConcentration = getPartnerConcentration(
    exportPartners.map((partner) => partner.sharedFlows)
  );

  const getPartnerShare = (sharedFlows: number, totalFlows: number) =>
    totalFlows > 0 ? (sharedFlows / totalFlows) * 100 : 0;

  const comparePartnerShortcuts = Array.from(
    new Set(
      country.topPartners
        .map((partner) => ({
          name: partner.name,
          slug: partnerSlugByName.get(partner.name) ?? null,
        }))
        .filter((partner): partner is { name: string; slug: string } => partner.slug !== null)
        .map((partner) => `${partner.name}::${partner.slug}`)
    )
  )
    .map((entry) => {
      const [name, slug] = entry.split("::");
      return { name, slug };
    })
    .slice(0, 6);

  const fallbackCompareCountrySlug =
    comparePartnerShortcuts[0]?.slug ??
    getCountryProfiles().find((profile) => profile.slug !== country.slug)?.slug ??
    country.slug;

  const partnerRoleMatrix = Array.from(
    country.topPartners
      .reduce(
        (map, partner) => {
          const existing = map.get(partner.name) ?? {
            name: partner.name,
            importFlows: 0,
            exportFlows: 0,
          };

          if (partner.role === "import-partner") {
            existing.importFlows += partner.sharedFlows;
          }

          if (partner.role === "export-partner") {
            existing.exportFlows += partner.sharedFlows;
          }

          map.set(partner.name, existing);
          return map;
        },
        new Map<
          string,
          {
            name: string;
            importFlows: number;
            exportFlows: number;
          }
        >()
      )
      .values()
  )
    .map((partner) => {
      const importShare = getPartnerShare(partner.importFlows, importConcentration.total);
      const exportShare = getPartnerShare(partner.exportFlows, exportConcentration.total);
      const totalFlows = partner.importFlows + partner.exportFlows;

      return {
        ...partner,
        importShare,
        exportShare,
        totalFlows,
        roleCoverage:
          partner.importFlows > 0 && partner.exportFlows > 0
            ? "Both"
            : partner.importFlows > 0
              ? "Import only"
              : "Export only",
      };
    })
    .sort((a, b) => b.totalFlows - a.totalFlows || a.name.localeCompare(b.name));

  const materialCategoryCoverage = Array.from(
    country.materialRecords
      .reduce(
        (map, record) => {
          const existing = map.get(record.category) ?? {
            category: record.category,
            recordCount: 0,
            highConfidenceCount: 0,
            latestYear: record.year,
            materials: new Set<string>(),
            sources: new Set<string>(),
          };

          existing.recordCount += 1;
          if (record.confidence === "High") {
            existing.highConfidenceCount += 1;
          }
          existing.latestYear = Math.max(existing.latestYear, record.year);
          existing.materials.add(record.materialSlug);
          existing.sources.add(record.sourceUrl);

          map.set(record.category, existing);
          return map;
        },
        new Map<
          string,
          {
            category: string;
            recordCount: number;
            highConfidenceCount: number;
            latestYear: number;
            materials: Set<string>;
            sources: Set<string>;
          }
        >()
      )
      .values()
  )
    .map((entry) => ({
      category: entry.category,
      recordCount: entry.recordCount,
      highConfidenceCount: entry.highConfidenceCount,
      latestYear: entry.latestYear,
      materialCount: entry.materials.size,
      sourceCount: entry.sources.size,
      highConfidenceShare:
        entry.recordCount > 0 ? (entry.highConfidenceCount / entry.recordCount) * 100 : 0,
    }))
    .sort((a, b) => b.recordCount - a.recordCount || a.category.localeCompare(b.category));

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
        title="Compare shortcuts"
        subtitle="Launch prefilled country-vs-country comparisons from this detail page."
      >
        <p className="sectionIntro">
          Baseline: <strong>{country.name}</strong> as the left country in compare view.
        </p>
        {comparePartnerShortcuts.length > 0 ? (
          <div className="linkChipList">
            {comparePartnerShortcuts.map((partner) => {
              const compareParams = new URLSearchParams({
                leftCountry: country.slug,
                rightCountry: partner.slug,
              });

              return (
                <Link
                  key={`${country.slug}-compare-${partner.slug}`}
                  href={`/compare?${compareParams.toString()}`}
                  className="linkChip"
                >
                  <span>
                    {country.name} vs {partner.name}
                  </span>
                  <span>Open compare</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="sectionIntro">
            No mapped partner country pages available yet for quick compare links.
          </p>
        )}
      </Card>

      <Card
        title="Dependency indicators"
        subtitle="Partner concentration metrics to flag potential exposure when a small number of counterparties dominate flows."
      >
        <div className="spotlightGrid">
          <article className="statCard">
            <p className="statLabel">Import-partner concentration (HHI)</p>
            <p className="statValue">
              {Math.round(importConcentration.hhi).toLocaleString()} ·{" "}
              {importConcentration.riskBand}
            </p>
            <p className="statHint">
              Top partner share: {importConcentration.topShare.toFixed(1)}% of tracked import links
            </p>
          </article>
          <article className="statCard">
            <p className="statLabel">Export-partner concentration (HHI)</p>
            <p className="statValue">
              {Math.round(exportConcentration.hhi).toLocaleString()} ·{" "}
              {exportConcentration.riskBand}
            </p>
            <p className="statHint">
              Top partner share: {exportConcentration.topShare.toFixed(1)}% of tracked export links
            </p>
          </article>
          <article className="statCard">
            <p className="statLabel">Tracked partner links</p>
            <p className="statValue">
              {importConcentration.total.toLocaleString()} import ·{" "}
              {exportConcentration.total.toLocaleString()} export
            </p>
            <p className="statHint">
              Based on partner frequencies in the current explorer dataset.
            </p>
          </article>
        </div>
      </Card>

      <Card
        title="Partner role matrix"
        subtitle="Unified partner table showing import/export overlap, role coverage, and share of tracked links."
      >
        {partnerRoleMatrix.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Partner country</th>
                  <th>Role coverage</th>
                  <th>Import links</th>
                  <th>Import share</th>
                  <th>Export links</th>
                  <th>Export share</th>
                  <th>Total links</th>
                </tr>
              </thead>
              <tbody>
                {partnerRoleMatrix.map((partner) => {
                  const slug = partnerSlugByName.get(partner.name);

                  return (
                    <tr key={`${country.slug}-matrix-${partner.name}`}>
                      <td>
                        {slug ? (
                          <Link href={`/countries/${slug}`}>{partner.name}</Link>
                        ) : (
                          partner.name
                        )}
                      </td>
                      <td>{partner.roleCoverage}</td>
                      <td>{partner.importFlows}</td>
                      <td>{partner.importShare.toFixed(1)}%</td>
                      <td>{partner.exportFlows}</td>
                      <td>{partner.exportShare.toFixed(1)}%</td>
                      <td>{partner.totalFlows}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No partner matrix rows yet.</p>
        )}
      </Card>

      <Card
        title="Partner concentration"
        subtitle="Most frequent counterparties split by import and export context, with country drilldowns."
      >
        {country.topPartners.length > 0 ? (
          <>
            <StatGrid>
              <StatCard label="Import partners" value={String(importPartners.length)} />
              <StatCard label="Export partners" value={String(exportPartners.length)} />
            </StatGrid>

            <div className="gridTwo">
              <article>
                <p className="sectionEyebrow">When importing</p>
                {importPartners.length > 0 ? (
                  <div className="tableWrap">
                    <table className="flowTable">
                      <thead>
                        <tr>
                          <th>Partner country</th>
                          <th>Shared flows</th>
                          <th>Share of import links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPartners.map((partner) => {
                          const slug = partnerSlugByName.get(partner.name);
                          const share = getPartnerShare(
                            partner.sharedFlows,
                            importConcentration.total
                          );

                          return (
                            <tr key={`${country.slug}-${partner.role}-${partner.name}`}>
                              <td>
                                {slug ? (
                                  <Link href={`/countries/${slug}`}>{partner.name}</Link>
                                ) : (
                                  partner.name
                                )}
                              </td>
                              <td>{partner.sharedFlows}</td>
                              <td>{share.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sectionIntro">No import partner rows yet.</p>
                )}
              </article>

              <article>
                <p className="sectionEyebrow">When exporting</p>
                {exportPartners.length > 0 ? (
                  <div className="tableWrap">
                    <table className="flowTable">
                      <thead>
                        <tr>
                          <th>Partner country</th>
                          <th>Shared flows</th>
                          <th>Share of export links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportPartners.map((partner) => {
                          const slug = partnerSlugByName.get(partner.name);
                          const share = getPartnerShare(
                            partner.sharedFlows,
                            exportConcentration.total
                          );

                          return (
                            <tr key={`${country.slug}-${partner.role}-${partner.name}`}>
                              <td>
                                {slug ? (
                                  <Link href={`/countries/${slug}`}>{partner.name}</Link>
                                ) : (
                                  partner.name
                                )}
                              </td>
                              <td>{partner.sharedFlows}</td>
                              <td>{share.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sectionIntro">No export partner rows yet.</p>
                )}
              </article>
            </div>
          </>
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
        title="Material coverage by category"
        subtitle="Category-level view of exact records, confidence density, freshness, and source footprint for this country."
      >
        {materialCategoryCoverage.length > 0 ? (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Materials</th>
                  <th>Records</th>
                  <th>High-confidence</th>
                  <th>Latest year</th>
                  <th>Distinct sources</th>
                  <th>Compare shortcut</th>
                </tr>
              </thead>
              <tbody>
                {materialCategoryCoverage.map((entry) => {
                  const compareParams = new URLSearchParams({
                    leftCountry: country.slug,
                    rightCountry: fallbackCompareCountrySlug,
                    highConfidenceOnly: "1",
                  });

                  return (
                    <tr key={`${country.slug}-material-category-${entry.category}`}>
                      <td>{entry.category}</td>
                      <td>{entry.materialCount}</td>
                      <td>{entry.recordCount}</td>
                      <td>
                        {entry.highConfidenceCount}/{entry.recordCount} (
                        {entry.highConfidenceShare.toFixed(1)}%)
                      </td>
                      <td>{entry.latestYear}</td>
                      <td>{entry.sourceCount}</td>
                      <td>
                        <Link href={`/compare?${compareParams.toString()}`}>Open in compare</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sectionIntro">No material category coverage rows yet.</p>
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
