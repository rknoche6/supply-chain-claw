"use client";

import { useMemo, useState } from "react";
import { Card, SectionHeader, StatCard, StatGrid } from "./components";
import { categories, tradeFlows } from "../lib/trade-data";

const portCoordinates: Record<string, { x: number; y: number }> = {
  Taipei: { x: 760, y: 250 },
  "Los Angeles": { x: 130, y: 280 },
  Chicago: { x: 200, y: 240 },
  Hsinchu: { x: 770, y: 255 },
  Singapore: { x: 700, y: 380 },
  Rotterdam: { x: 470, y: 170 },
  Callao: { x: 170, y: 470 },
  Shanghai: { x: 790, y: 260 },
  Perth: { x: 760, y: 510 },
  Ningbo: { x: 800, y: 275 },
  Guayaquil: { x: 150, y: 410 },
  Novorossiysk: { x: 555, y: 215 },
  Alexandria: { x: 530, y: 250 },
  Qatar: { x: 590, y: 285 },
  Yokohama: { x: 830, y: 250 },
};

type CategoryFilter = (typeof categories)[number];
type ViewMode = "cards" | "table";
type SortMode = "relevance" | "product" | "importers" | "exporters";

export default function TradeExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [country, setCountry] = useState("All countries");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortMode, setSortMode] = useState<SortMode>("relevance");

  const countries = useMemo(() => {
    const all = new Set<string>();
    for (const flow of tradeFlows) {
      flow.topImporters.forEach((item) => all.add(item));
      flow.topExporters.forEach((item) => all.add(item));
    }
    return ["All countries", ...Array.from(all).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tradeFlows.filter((flow) => {
      const byCategory = category === "All" || flow.category === category;
      const byCountry =
        country === "All countries" ||
        flow.topImporters.includes(country) ||
        flow.topExporters.includes(country);
      const byQuery =
        q.length === 0 ||
        flow.product.toLowerCase().includes(q) ||
        flow.keyRoute.toLowerCase().includes(q) ||
        flow.topImporters.some((item) => item.toLowerCase().includes(q)) ||
        flow.topExporters.some((item) => item.toLowerCase().includes(q));
      return byCategory && byCountry && byQuery;
    });
  }, [category, country, query]);

  const sortedFlows = useMemo(() => {
    const items = [...filtered];

    if (sortMode === "product") {
      items.sort((a, b) => a.product.localeCompare(b.product));
    }

    if (sortMode === "importers") {
      items.sort((a, b) => b.topImporters.length - a.topImporters.length);
    }

    if (sortMode === "exporters") {
      items.sort((a, b) => b.topExporters.length - a.topExporters.length);
    }

    return items;
  }, [filtered, sortMode]);

  const topImporters = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((flow) =>
      flow.topImporters.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const topExporters = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((flow) =>
      flow.topExporters.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const mappedRoutes = useMemo(() => {
    return filtered
      .map((flow, index) => {
        const stops = flow.keyRoute.split("→").map((item) => item.trim());
        const points = stops.map((stop) => portCoordinates[stop]).filter(Boolean);
        if (points.length < 2) {
          return null;
        }

        return {
          id: `${flow.product}-${index}`,
          product: flow.product,
          points,
        };
      })
      .filter(Boolean) as { id: string; product: string; points: { x: number; y: number }[] }[];
  }, [filtered]);

  const mapPorts = useMemo(() => {
    const unique = new Map<string, { x: number; y: number }>();
    mappedRoutes.forEach((route) => {
      route.points.forEach((point) => {
        unique.set(`${point.x}-${point.y}`, point);
      });
    });
    return Array.from(unique.values());
  }, [mappedRoutes]);

  return (
    <>
      <Card>
        <SectionHeader
          eyebrow="Explore"
          title="Global supply-chain search"
          description="Search products and routes, filter by category, and drill down by individual country."
        />

        <div className="filters">
          <label>
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="GPU, copper, banana, Rotterdam..."
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filterActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setCountry("All countries");
              setSortMode("relevance");
            }}
          >
            Reset filters
          </button>
        </div>
      </Card>

      <Card
        title="Importers and exporters summary"
        subtitle="Top countries in the current filtered view."
      >
        <StatGrid>
          <StatCard label="Matching flows" value={String(filtered.length)} />
          <StatCard
            label="Categories in view"
            value={String(new Set(filtered.map((f) => f.category)).size)}
          />
          <article className="statCard">
            <p className="statLabel">Top importers</p>
            <ul className="miniList">
              {topImporters.map(([name, count]) => (
                <li key={name}>
                  {name} <span>({count})</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="statCard">
            <p className="statLabel">Top exporters</p>
            <ul className="miniList">
              {topExporters.map(([name, count]) => (
                <li key={name}>
                  {name} <span>({count})</span>
                </li>
              ))}
            </ul>
          </article>
        </StatGrid>
      </Card>

      <Card
        title="Filtered route map"
        subtitle="A quick geographic view of routes in your current filtered results."
      >
        <div className="mapFrame" role="img" aria-label="Map of filtered supply routes">
          <svg viewBox="0 0 960 560">
            <rect className="ocean" x="0" y="0" width="960" height="560" />
            <ellipse className="continent" cx="180" cy="220" rx="140" ry="110" />
            <ellipse className="continent" cx="260" cy="430" rx="90" ry="120" />
            <ellipse className="continent" cx="520" cy="180" rx="120" ry="80" />
            <ellipse className="continent" cx="560" cy="300" rx="120" ry="140" />
            <ellipse className="continent" cx="760" cy="250" rx="180" ry="140" />
            <ellipse className="continent" cx="790" cy="500" rx="90" ry="55" />

            {mappedRoutes.map((route, idx) => (
              <polyline
                key={route.id}
                className="route"
                points={route.points.map((p) => `${p.x},${p.y}`).join(" ")}
                style={{ opacity: 0.55 + (idx % 3) * 0.15 }}
              />
            ))}

            {mapPorts.map((port) => (
              <circle key={`${port.x}-${port.y}`} className="port" cx={port.x} cy={port.y} r="5" />
            ))}
          </svg>
        </div>
        <p className="sectionIntro">
          Showing {mappedRoutes.length} mapped routes and {mapPorts.length} active ports.
        </p>
      </Card>

      <Card
        title="Filtered supply flows"
        subtitle="Focus on what matters now — products, routes, and country participation."
      >
        <div className="flowToolbar">
          <p className="sectionIntro">{sortedFlows.length} results</p>
          <div className="flowToolbarControls">
            <label>
              Data view
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                aria-label="Select data view"
              >
                <option value="cards">Cards</option>
                <option value="table">Table</option>
              </select>
            </label>
            <label>
              Sort by
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Select sort order"
              >
                <option value="relevance">Relevance</option>
                <option value="product">Product A-Z</option>
                <option value="importers">Most importers</option>
                <option value="exporters">Most exporters</option>
              </select>
            </label>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="flowList">
            {sortedFlows.map((flow) => (
              <article key={`${flow.category}-${flow.product}`} className="flowCard">
                <p className="flowCategory">{flow.category}</p>
                <h3>{flow.product}</h3>
                <p className="flowRoute">{flow.keyRoute}</p>
                <p>
                  <strong>Importers:</strong> {flow.topImporters.join(", ")}
                </p>
                <p>
                  <strong>Exporters:</strong> {flow.topExporters.join(", ")}
                </p>
              </article>
            ))}
            {sortedFlows.length === 0 ? <p>No matching flows yet. Try a broader filter.</p> : null}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Route</th>
                  <th>Importers</th>
                  <th>Exporters</th>
                </tr>
              </thead>
              <tbody>
                {sortedFlows.map((flow) => (
                  <tr key={`${flow.category}-${flow.product}`}>
                    <td>{flow.product}</td>
                    <td>{flow.category}</td>
                    <td>{flow.keyRoute}</td>
                    <td>{flow.topImporters.join(", ")}</td>
                    <td>{flow.topExporters.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedFlows.length === 0 ? <p>No matching flows yet. Try a broader filter.</p> : null}
          </div>
        )}
      </Card>
    </>
  );
}
