"use client";

import { useMemo, useState } from "react";
import { Card, SectionHeader, StatCard, StatGrid } from "./components";
import { categories, tradeFlows } from "../lib/trade-data";

type CategoryFilter = (typeof categories)[number];

export default function TradeExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [country, setCountry] = useState("All countries");

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
        title="Filtered supply flows"
        subtitle="Focus on what matters now — products, routes, and country participation."
      >
        <div className="flowList">
          {filtered.map((flow) => (
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
          {filtered.length === 0 ? <p>No matching flows yet. Try a broader filter.</p> : null}
        </div>
      </Card>
    </>
  );
}
