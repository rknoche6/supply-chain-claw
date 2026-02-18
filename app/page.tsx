import Link from "next/link";
import { Card, Container, Pill, StatCard, StatGrid } from "./components";
import RawMaterialsExplorer from "./raw-materials-explorer";
import TradeExplorer from "./trade-explorer";
import ExplorerLaunchpad from "./explorer-launchpad";
import ExplorerCommandSearch from "./explorer-command-search";
import ExplorerDrilldownBrowser from "./explorer-drilldown-browser";
import { getCountryProfiles } from "../lib/countries";
import { getDataPointConfidence, rawMaterials } from "../lib/raw-materials";

const featuredMaterials = [...rawMaterials]
  .sort((a, b) => b.dataPoints.length - a.dataPoints.length || a.name.localeCompare(b.name))
  .slice(0, 6);

const countryProfiles = getCountryProfiles();

const featuredCountries = [...countryProfiles]
  .sort(
    (a, b) =>
      b.roleBreakdown.totalFlows - a.roleBreakdown.totalFlows ||
      b.roleBreakdown.exporterCount +
        b.roleBreakdown.importerCount -
        (a.roleBreakdown.exporterCount + a.roleBreakdown.importerCount) ||
      a.name.localeCompare(b.name)
  )
  .slice(0, 8);

const allDataPoints = rawMaterials.flatMap((material) => material.dataPoints);
const highConfidenceDataPoints = allDataPoints.filter(
  (point) => getDataPointConfidence(point) === "High"
);
const uniqueSourceCount = new Set(allDataPoints.map((point) => point.sourceUrl)).size;
const latestReferenceYear = allDataPoints.length
  ? Math.max(...allDataPoints.map((point) => point.year))
  : null;
const materialCategoryCount = new Set(rawMaterials.map((material) => material.category)).size;

export default function HomePage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Live explorer</Pill>
        <h1>Supply Chain Claw</h1>
        <p>
          Search global trade flows, filter by category, compare importer/exporter concentration,
          and drill into specific countries.
        </p>
        <p>
          Explore details: <Link href="/compare">Compare</Link> ·{" "}
          <Link href="/methodology">Methodology</Link>
        </p>
      </header>

      <ExplorerCommandSearch />

      <Card
        title="Explorer command-center snapshot"
        subtitle="Live coverage metrics for countries, materials, source citations, and confidence density in the current dataset."
      >
        <StatGrid>
          <StatCard label="Countries with detail pages" value={String(countryProfiles.length)} />
          <StatCard label="Material detail pages" value={String(rawMaterials.length)} />
          <StatCard label="Material categories" value={String(materialCategoryCount)} />
          <StatCard label="Numeric records" value={String(allDataPoints.length)} />
          <StatCard
            label="High-confidence records"
            value={`${highConfidenceDataPoints.length}/${allDataPoints.length}`}
            hint={
              allDataPoints.length > 0
                ? `${((highConfidenceDataPoints.length / allDataPoints.length) * 100).toFixed(1)}% confidence-complete`
                : "No records yet"
            }
          />
          <StatCard
            label="Source links"
            value={String(uniqueSourceCount)}
            hint={latestReferenceYear ? `Latest reference year ${latestReferenceYear}` : "—"}
          />
        </StatGrid>
      </Card>

      <Card
        title="Quick drilldowns"
        subtitle="Jump directly into material and country detail pages used most in the current explorer dataset."
      >
        <div className="gridTwo">
          <div>
            <p className="sectionEyebrow">Materials</p>
            <div className="linkChipList">
              {featuredMaterials.map((material) => (
                <Link key={material.slug} href={`/materials/${material.slug}`} className="linkChip">
                  <span>{material.name}</span>
                  <span>{material.dataPoints.length} records</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="sectionEyebrow">Countries</p>
            <div className="linkChipList">
              {featuredCountries.map((country) => (
                <Link key={country.slug} href={`/countries/${country.slug}`} className="linkChip">
                  <span>{country.name}</span>
                  <span>{country.roleBreakdown.totalFlows} flows</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <ExplorerDrilldownBrowser />
      <ExplorerLaunchpad />
      <RawMaterialsExplorer />
      <TradeExplorer />
    </Container>
  );
}
