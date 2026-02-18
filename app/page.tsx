import Link from "next/link";
import { Card, Container, Pill, StatCard, StatGrid } from "./components";
import ExplorerCommandSearch from "./explorer-command-search";
import { getCountryProfiles } from "../lib/countries";
import { getDataPointConfidence, rawMaterials } from "../lib/raw-materials";

const countryProfiles = getCountryProfiles();
const allDataPoints = rawMaterials.flatMap((material) => material.dataPoints);
const highConfidenceDataPoints = allDataPoints.filter(
  (point) => getDataPointConfidence(point) === "High"
);

export default function HomePage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Explorer home</Pill>
        <h1>Supply Chain Claw</h1>
        <p>Fast entry point. Use dedicated pages for full datasets and drilldowns.</p>
      </header>

      <ExplorerCommandSearch />

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
