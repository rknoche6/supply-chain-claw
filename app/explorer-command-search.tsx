"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionHeader } from "./components";
import { getCountryProfiles } from "../lib/countries";
import { rawMaterials } from "../lib/raw-materials";

const countryProfiles = getCountryProfiles();

type SearchResult = {
  key: string;
  name: string;
  href: string;
  type: "Material" | "Country";
  meta: string;
};

export default function ExplorerCommandSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [] as SearchResult[];
    }

    const materialMatches = rawMaterials
      .filter(
        (material) =>
          material.name.toLowerCase().includes(normalizedQuery) ||
          material.category.toLowerCase().includes(normalizedQuery) ||
          material.notes.toLowerCase().includes(normalizedQuery)
      )
      .map((material) => ({
        key: `material-${material.slug}`,
        name: material.name,
        href: `/materials/${material.slug}`,
        type: "Material" as const,
        meta: `${material.category} · ${material.dataPoints.length} records`,
      }));

    const countryMatches = countryProfiles
      .filter(
        (country) =>
          country.name.toLowerCase().includes(normalizedQuery) ||
          country.products.some(
            (product) =>
              product.product.toLowerCase().includes(normalizedQuery) ||
              product.category.toLowerCase().includes(normalizedQuery)
          )
      )
      .map((country) => ({
        key: `country-${country.slug}`,
        name: country.name,
        href: `/countries/${country.slug}`,
        type: "Country" as const,
        meta: `${country.roleBreakdown.totalFlows} flows · ${country.materialRecords.length} material records`,
      }));

    return [...materialMatches, ...countryMatches]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [query]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Explorer command center"
        title="Jump directly to country and material detail pages"
        description="Search by country, material, category, or product keyword to open focused detail views."
      />

      <label>
        Search countries and materials
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="lithium, chile, fertilizer, copper..."
        />
      </label>

      {query.trim().length === 0 ? (
        <p className="sectionIntro">Start typing to open direct drilldowns.</p>
      ) : results.length > 0 ? (
        <div className="linkChipList">
          {results.map((result) => (
            <Link key={result.key} href={result.href} className="linkChip">
              <span>
                {result.type}: {result.name}
              </span>
              <span>{result.meta}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="sectionIntro">No direct drilldowns match this query yet.</p>
      )}
    </Card>
  );
}
