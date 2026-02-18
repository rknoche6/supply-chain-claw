"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionHeader } from "./components";
import {
  getDataPointConfidence,
  getFreshnessLabel,
  rawMaterialCategories,
  rawMaterials,
} from "../lib/raw-materials";
import { getCountryProfiles, toCountrySlug } from "../lib/countries";

type MaterialCategory = (typeof rawMaterialCategories)[number];

export default function RawMaterialsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("All");
  const [country, setCountry] = useState("All countries");

  const countries = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((m) => m.dataPoints.forEach((d) => set.add(d.country)));
    return ["All countries", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  const countrySlugSet = useMemo(
    () => new Set(getCountryProfiles().map((countryProfile) => countryProfile.slug)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rawMaterials
      .filter((item) => {
        const byCategory = category === "All" || item.category === category;
        const byCountry =
          country === "All countries" || item.dataPoints.some((point) => point.country === country);
        const byQuery =
          q.length === 0 ||
          item.name.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q) ||
          item.dataPoints.some((d) => d.country.toLowerCase().includes(q));

        return byCategory && byCountry && byQuery;
      })
      .map((item) => ({
        ...item,
        dataPoints: [...item.dataPoints].sort((a, b) => b.value - a.value),
      }));
  }, [category, country, query]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Raw materials"
        title="High-precision material concentration"
        description="Numeric country-level values with unit, year, and source links."
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

      {filtered.map((item) => (
        <article key={item.name} className="flowCard">
          <p className="flowCategory">{item.category}</p>
          <h3>
            <Link href={`/materials/${item.slug}`}>{item.name}</Link>
          </h3>
          <p className="sectionIntro">{item.notes}</p>
          <p className="sectionIntro">Last updated: {item.updatedAt}</p>

          <div className="tableWrap">
            <table className="flowTable">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Year</th>
                  <th>Freshness</th>
                  <th>Confidence</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {item.dataPoints.map((point) => {
                  const freshness = getFreshnessLabel(point.year, item.updatedAt);
                  const confidence = getDataPointConfidence(point);
                  const countrySlug = toCountrySlug(point.country);
                  const hasCountryPage = countrySlugSet.has(countrySlug);

                  return (
                    <tr key={`${item.name}-${point.country}-${point.metric}-${point.year}`}>
                      <td>
                        {hasCountryPage ? (
                          <Link href={`/countries/${countrySlug}`}>{point.country}</Link>
                        ) : (
                          point.country
                        )}
                      </td>
                      <td>{point.metric}</td>
                      <td>
                        {point.value.toLocaleString()} {point.unit}
                      </td>
                      <td>{point.year}</td>
                      <td>{freshness}</td>
                      <td>{confidence}</td>
                      <td>
                        <a href={point.sourceUrl} target="_blank" rel="noreferrer">
                          {point.sourceName}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      ))}

      {filtered.length === 0 ? (
        <p className="sectionIntro">No matches. Try broader filters.</p>
      ) : null}
    </Card>
  );
}
