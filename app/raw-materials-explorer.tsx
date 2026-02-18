"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionHeader, StatCard, StatGrid } from "./components";
import {
  getDataPointConfidence,
  getFreshnessLabel,
  rawMaterialCategories,
  rawMaterials,
} from "../lib/raw-materials";
import { getCountryProfiles, toCountrySlug } from "../lib/countries";

type MaterialCategory = (typeof rawMaterialCategories)[number];
type ConfidenceFilter = "All confidence" | "High only" | "High + Medium";
type FreshnessFilter = "All freshness" | "Current only" | "Current + Recent";
type YearFilter = "All years" | `${number}`;

export default function RawMaterialsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("All");
  const [country, setCountry] = useState("All countries");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All confidence");
  const [freshnessFilter, setFreshnessFilter] = useState<FreshnessFilter>("All freshness");
  const [yearFilter, setYearFilter] = useState<YearFilter>("All years");

  const countries = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((m) => m.dataPoints.forEach((d) => set.add(d.country)));
    return ["All countries", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    rawMaterials.forEach((material) => material.dataPoints.forEach((point) => set.add(point.year)));
    return [
      "All years",
      ...Array.from(set)
        .sort((a, b) => b - a)
        .map((year) => String(year)),
    ];
  }, []);

  const countrySlugSet = useMemo(
    () => new Set(getCountryProfiles().map((countryProfile) => countryProfile.slug)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rawMaterials
      .map((item) => {
        const filteredPoints = item.dataPoints
          .filter((point) => {
            const byCountry = country === "All countries" || point.country === country;
            const byYear = yearFilter === "All years" || String(point.year) === yearFilter;
            const confidence = getDataPointConfidence(point);
            const freshness = getFreshnessLabel(point.year, item.updatedAt);

            const byConfidence =
              confidenceFilter === "All confidence" ||
              (confidenceFilter === "High only" && confidence === "High") ||
              (confidenceFilter === "High + Medium" && confidence !== "Low");

            const byFreshness =
              freshnessFilter === "All freshness" ||
              (freshnessFilter === "Current only" && freshness === "Current") ||
              (freshnessFilter === "Current + Recent" && freshness !== "Stale");

            return byCountry && byYear && byConfidence && byFreshness;
          })
          .sort((a, b) => b.value - a.value);

        return {
          ...item,
          dataPoints: filteredPoints,
        };
      })
      .filter((item) => {
        const byCategory = category === "All" || item.category === category;
        const byQuery =
          q.length === 0 ||
          item.name.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q) ||
          item.dataPoints.some((d) => d.country.toLowerCase().includes(q));

        return byCategory && byQuery && item.dataPoints.length > 0;
      });
  }, [category, confidenceFilter, country, freshnessFilter, query, yearFilter]);

  const countryLeaderboard = useMemo(() => {
    const stats = new Map<string, { records: number; materials: Set<string> }>();

    filtered.forEach((material) => {
      material.dataPoints.forEach((point) => {
        const current = stats.get(point.country) ?? { records: 0, materials: new Set<string>() };
        current.records += 1;
        current.materials.add(material.slug);
        stats.set(point.country, current);
      });
    });

    return Array.from(stats.entries())
      .map(([name, value]) => ({
        name,
        records: value.records,
        materials: value.materials.size,
      }))
      .sort(
        (a, b) => b.records - a.records || b.materials - a.materials || a.name.localeCompare(b.name)
      )
      .slice(0, 8);
  }, [filtered]);

  const totalVisibleRecords = filtered.reduce((sum, item) => sum + item.dataPoints.length, 0);
  const highConfidenceVisibleRecords = filtered.reduce(
    (sum, item) =>
      sum + item.dataPoints.filter((point) => getDataPointConfidence(point) === "High").length,
    0
  );
  const visibleYears = Array.from(
    new Set(filtered.flatMap((item) => item.dataPoints.map((point) => point.year)))
  ).sort((a, b) => b - a);

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

        <label>
          Year filter
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value as YearFilter)}>
            {years.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label>
          Confidence filter
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)}
          >
            <option>All confidence</option>
            <option>High only</option>
            <option>High + Medium</option>
          </select>
        </label>

        <label>
          Freshness filter
          <select
            value={freshnessFilter}
            onChange={(e) => setFreshnessFilter(e.target.value as FreshnessFilter)}
          >
            <option>All freshness</option>
            <option>Current only</option>
            <option>Current + Recent</option>
          </select>
        </label>
      </div>

      <StatGrid>
        <StatCard label="Materials in view" value={String(filtered.length)} />
        <StatCard label="Numeric records in view" value={String(totalVisibleRecords)} />
        <StatCard
          label="High-confidence records in view"
          value={String(highConfidenceVisibleRecords)}
        />
        <StatCard
          label="Reference years in view"
          value={visibleYears.length > 0 ? visibleYears.join(", ") : "—"}
        />
        <article className="statCard">
          <p className="statLabel">Top countries in current filters</p>
          <ul className="miniList">
            {countryLeaderboard.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  className={`quickFilterButton ${country === item.name ? "isActive" : ""}`}
                  onClick={() => setCountry(item.name)}
                >
                  {item.name}{" "}
                  <span>
                    ({item.records} records · {item.materials} materials)
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </article>
      </StatGrid>

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
