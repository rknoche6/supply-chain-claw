import Link from "next/link";
import { Card, Container, Pill, StatCard, StatGrid } from "./components";
import ExplorerCommandSearch from "./explorer-command-search";
import TradeExplorer from "./trade-explorer";
import { getCountryProfiles } from "../lib/countries";
import { getDataPointConfidence, rawMaterials } from "../lib/raw-materials";
import { tradeFlows } from "../lib/trade-data";

const countryProfiles = getCountryProfiles();
const allDataPoints = rawMaterials.flatMap((material) => material.dataPoints);
const highConfidenceDataPoints = allDataPoints.filter(
  (point) => getDataPointConfidence(point) === "High"
);

const defaultLeftCountry = countryProfiles[0]?.slug ?? "";
const defaultRightCountry = countryProfiles[1]?.slug ?? countryProfiles[0]?.slug ?? "";
const defaultLeftMaterial = rawMaterials[0]?.slug ?? "";
const defaultRightMaterial = rawMaterials[1]?.slug ?? rawMaterials[0]?.slug ?? "";

const compareShortcut =
  defaultLeftCountry && defaultRightCountry && defaultLeftMaterial && defaultRightMaterial
    ? `/compare?${new URLSearchParams({
        leftCountry: defaultLeftCountry,
        rightCountry: defaultRightCountry,
        leftMaterial: defaultLeftMaterial,
        rightMaterial: defaultRightMaterial,
        highConfidenceOnly: "1",
      }).toString()}`
    : "/compare";

const countrySlugByName = new Map(countryProfiles.map((country) => [country.name, country.slug]));

const topImporterRows = Array.from(
  tradeFlows.reduce((map, flow) => {
    flow.topImporters.forEach((countryName) => {
      map.set(countryName, (map.get(countryName) ?? 0) + 1);
    });

    return map;
  }, new Map<string, number>())
)
  .map(([name, flowCount]) => ({
    name,
    flowCount,
    slug: countrySlugByName.get(name) ?? null,
  }))
  .sort((a, b) => b.flowCount - a.flowCount || a.name.localeCompare(b.name))
  .slice(0, 6);

const topExporterRows = Array.from(
  tradeFlows.reduce((map, flow) => {
    flow.topExporters.forEach((countryName) => {
      map.set(countryName, (map.get(countryName) ?? 0) + 1);
    });

    return map;
  }, new Map<string, number>())
)
  .map(([name, flowCount]) => ({
    name,
    flowCount,
    slug: countrySlugByName.get(name) ?? null,
  }))
  .sort((a, b) => b.flowCount - a.flowCount || a.name.localeCompare(b.name))
  .slice(0, 6);

export default function HomePage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Explorer home</Pill>
        <h1>Supply Chain Claw</h1>
        <p>Fast entry point. Use dedicated pages for full datasets and drilldowns.</p>
      </header>

      <ExplorerCommandSearch />

      <TradeExplorer />

      <Card
        title="Quick launch"
        subtitle="Open pre-filtered explorer views focused on cited numeric records."
      >
        <div className="linkChipList">
          <Link href={compareShortcut} className="linkChip">
            <span>High-confidence compare</span>
            <span>Prefilled country + material baseline</span>
          </Link>
          {countryProfiles.slice(0, 3).map((country) => (
            <Link
              key={`home-country-${country.slug}`}
              href={`/countries/${country.slug}`}
              className="linkChip"
            >
              <span>{country.name}</span>
              <span>Country role + partner drilldown</span>
            </Link>
          ))}
          {rawMaterials.slice(0, 3).map((material) => (
            <Link
              key={`home-material-${material.slug}`}
              href={`/materials/${material.slug}`}
              className="linkChip"
            >
              <span>{material.name}</span>
              <span>Values, units, years, and citations</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title="Importer/exporter snapshot"
        subtitle="Top countries by appearance in current trade-flow importer/exporter lists."
      >
        <div className="gridTwo">
          <article>
            <p className="sectionEyebrow">Top importers in captured flows</p>
            <ol className="miniList">
              {topImporterRows.map((row) => (
                <li key={`home-importer-${row.name}`}>
                  {row.slug ? <Link href={`/countries/${row.slug}`}>{row.name}</Link> : row.name} —{" "}
                  {row.flowCount} flows
                </li>
              ))}
            </ol>
          </article>
          <article>
            <p className="sectionEyebrow">Top exporters in captured flows</p>
            <ol className="miniList">
              {topExporterRows.map((row) => (
                <li key={`home-exporter-${row.name}`}>
                  {row.slug ? <Link href={`/countries/${row.slug}`}>{row.name}</Link> : row.name} —{" "}
                  {row.flowCount} flows
                </li>
              ))}
            </ol>
          </article>
        </div>
      </Card>

      <Card title="Core pages" subtitle="Use dedicated URLs instead of one giant homepage.">
        <div className="linkChipList">
          <Link href="/materials" className="linkChip">
            <span>Materials directory</span>
            <span>Paginated list</span>
          </Link>
          <Link href="/countries" className="linkChip">
            <span>Countries directory</span>
            <span>Paginated list</span>
          </Link>
          <Link href="/compare" className="linkChip">
            <span>Compare</span>
            <span>Country/material comparison</span>
          </Link>
          <Link href="/methodology" className="linkChip">
            <span>Methodology</span>
            <span>Sources & confidence rules</span>
          </Link>
          <Link href="/games/20-questions" className="linkChip">
            <span>20 Questions game</span>
            <span>Optional fun page</span>
          </Link>
        </div>
      </Card>

      <Card title="Snapshot" subtitle="Current data footprint.">
        <StatGrid>
          <StatCard label="Material pages" value={String(rawMaterials.length)} />
          <StatCard label="Country pages" value={String(countryProfiles.length)} />
          <StatCard label="Numeric records" value={String(allDataPoints.length)} />
          <StatCard
            label="High-confidence"
            value={`${highConfidenceDataPoints.length}/${allDataPoints.length}`}
          />
        </StatGrid>
      </Card>
    </Container>
  );
}
