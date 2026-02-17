import Link from "next/link";
import { Container, Pill } from "./components";
import RawMaterialsExplorer from "./raw-materials-explorer";
import TradeExplorer from "./trade-explorer";

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
          Explore details: <Link href="/methodology">Methodology</Link>
        </p>
      </header>

      <RawMaterialsExplorer />
      <TradeExplorer />
    </Container>
  );
}
