import Link from "next/link";
import { Card, Container, Pill } from "./components";
import RawMaterialsExplorer from "./raw-materials-explorer";
import TradeExplorer from "./trade-explorer";
import { getCountryProfiles } from "../lib/countries";
import { rawMaterials } from "../lib/raw-materials";

const featuredMaterials = [...rawMaterials]
  .sort((a, b) => b.dataPoints.length - a.dataPoints.length || a.name.localeCompare(b.name))
  .slice(0, 6);

const featuredCountries = [...getCountryProfiles()]
  .sort(
    (a, b) =>
      b.roleBreakdown.totalFlows - a.roleBreakdown.totalFlows ||
      b.roleBreakdown.exporterCount +
        b.roleBreakdown.importerCount -
        (a.roleBreakdown.exporterCount + a.roleBreakdown.importerCount) ||
      a.name.localeCompare(b.name)
  )
  .slice(0, 8);

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

      <RawMaterialsExplorer />
      <TradeExplorer />
    </Container>
  );
}
