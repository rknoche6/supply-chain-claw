"use client";

import { useMemo, useState } from "react";
import { Card, SectionHeader } from "./components";
import { rawMaterialCategories, rawMaterials } from "../lib/raw-materials";

type MaterialCategory = (typeof rawMaterialCategories)[number];

export default function RawMaterialsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("All");
  const [country, setCountry] = useState("All countries");

  const countries = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((m) => m.majorCountries.forEach((c) => set.add(c)));
    return ["All countries", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rawMaterials.filter((item) => {
      const byCategory = category === "All" || item.category === category;
      const byCountry = country === "All countries" || item.majorCountries.includes(country);
      const byQuery =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        item.majorCountries.some((c) => c.toLowerCase().includes(q));

      return byCategory && byCountry && byQuery;
    });
  }, [category, country, query]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Raw materials"
        title="Where key materials are mostly located"
        description="Simple explorer for major material concentration by country."
      />

      <div className="filters">
        <label>
          Search material or country
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="iron, gold, chile, kazakhstan..."
          />
        </label>

        <label>
          Material category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MaterialCategory)}
          >
            {rawMaterialCategories.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label>
          Country filter
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flowList">
        {filtered.map((item) => (
          <article key={item.name} className="flowCard">
            <p className="flowCategory">{item.category}</p>
            <h3>{item.name}</h3>
            <p>
              <strong>Main countries:</strong> {item.majorCountries.join(", ")}
            </p>
            <p className="sectionIntro">{item.notes}</p>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="sectionIntro">No matches. Try broader filters.</p>
      ) : null}
    </Card>
  );
}
