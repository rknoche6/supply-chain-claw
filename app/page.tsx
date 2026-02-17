import { Card, Container, Pill } from "./components";
import { roadmapFocusAreas } from "../lib/roadmap";

const majorPorts = [
  { name: "Port of Shanghai", country: "China", role: "Electronics export" },
  { name: "Port of Singapore", country: "Singapore", role: "Transshipment hub" },
  { name: "Port of Rotterdam", country: "Netherlands", role: "Europe gateway" },
  { name: "Port of Los Angeles", country: "United States", role: "Pacific import" },
];

const sampleRoutes = [
  "Shenzhen → Singapore → Rotterdam",
  "Busan → Los Angeles",
  "Ho Chi Minh City → Singapore → Hamburg",
  "Kaohsiung → Long Beach",
];

const roadmapStatusByIndex = ["Now", "Next", "Planned", "Planned"] as const;

export default function HomePage() {
  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Phase A · Design system foundation</Pill>
        <h1>Supply Chain Claw</h1>
        <p>
          A growing open project to map how goods move from raw materials to finished products. This
          phase now includes a visual global network foundation with example routes and major port
          hubs.
        </p>
      </header>

      <Card title="Roadmap" subtitle="Priority-ordered milestones with current focus status.">
        <ol className="roadmapList">
          {roadmapFocusAreas.map((item, index) => (
            <li key={item} className="roadmapItem">
              <span>{item}</span>
              <Pill tone={index === 0 ? "success" : "neutral"}>{roadmapStatusByIndex[index]}</Pill>
            </li>
          ))}
        </ol>
      </Card>

      <Card
        title="Global network foundation"
        subtitle="Seed map of key regions, major ports, and example shipping corridors. More countries and product-level chains will be added in upcoming milestones."
      >
        <div className="mapFrame" aria-label="Global supply chain map">
          <svg viewBox="0 0 1000 470" role="img" aria-label="Stylized global shipping map">
            <rect x="0" y="0" width="1000" height="470" rx="16" className="ocean" />

            <ellipse cx="170" cy="210" rx="120" ry="90" className="continent" />
            <ellipse cx="360" cy="180" rx="100" ry="70" className="continent" />
            <ellipse cx="520" cy="260" rx="95" ry="65" className="continent" />
            <ellipse cx="720" cy="180" rx="170" ry="95" className="continent" />
            <ellipse cx="840" cy="320" rx="95" ry="65" className="continent" />

            <path d="M690 170 C620 170, 580 220, 540 250" className="route" />
            <path d="M760 170 C720 200, 690 230, 640 255" className="route" />
            <path d="M690 175 C770 170, 860 180, 905 200" className="route" />
            <path d="M540 250 C430 240, 300 220, 140 210" className="route" />

            <circle cx="690" cy="170" r="7" className="port" />
            <circle cx="760" cy="170" r="7" className="port" />
            <circle cx="540" cy="250" r="7" className="port" />
            <circle cx="905" cy="200" r="7" className="port" />

            <text x="675" y="155" className="label">
              Shanghai
            </text>
            <text x="735" y="155" className="label">
              Busan
            </text>
            <text x="505" y="275" className="label">
              Singapore
            </text>
            <text x="790" y="196" className="label">
              LA/Long Beach
            </text>
          </svg>
        </div>

        <div className="gridTwo">
          <div>
            <h3>Major ports (initial set)</h3>
            <ul>
              {majorPorts.map((port) => (
                <li key={port.name}>
                  <strong>{port.name}</strong> — {port.country} · {port.role}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Sample active routes</h3>
            <ul>
              {sampleRoutes.map((route) => (
                <li key={route}>{route}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </Container>
  );
}
