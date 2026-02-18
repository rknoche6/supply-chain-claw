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
  type: "Material" | "Country" | "View";
  meta: string;
};

function findCountrySlugByQuery(term: string) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    countryProfiles.find((country) => country.name.toLowerCase() === normalized)?.slug ??
    countryProfiles.find((country) => country.name.toLowerCase().includes(normalized))?.slug ??
    null
  );
}

function findMaterialSlugByQuery(term: string) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    rawMaterials.find((material) => material.name.toLowerCase() === normalized)?.slug ??
    rawMaterials.find((material) => material.name.toLowerCase().includes(normalized))?.slug ??
    null
  );
}

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

    const viewMatches = [] as SearchResult[];

    if (normalizedQuery.includes("countries") || normalizedQuery.includes("country")) {
      const countryParams = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed.length > 0) {
        countryParams.set("q", trimmed);
      }

      if (normalizedQuery.includes("importer")) {
        countryParams.set("role", "importer");
      }

      if (normalizedQuery.includes("exporter")) {
        countryParams.set("role", "exporter");
      }

      viewMatches.push({
        key: `view-countries-${countryParams.toString() || "all"}`,
        name: "Open countries directory",
        href: countryParams.toString() ? `/countries?${countryParams.toString()}` : "/countries",
        type: "View",
        meta:
          normalizedQuery.includes("importer") || normalizedQuery.includes("exporter")
            ? "Prefilled countries directory filters"
            : "Browse country pages with filters",
      });
    }

    if (normalizedQuery.includes("materials") || normalizedQuery.includes("material")) {
      const materialParams = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed.length > 0) {
        materialParams.set("q", trimmed);
      }

      const matchedCategory = rawMaterials.find((material) =>
        normalizedQuery.includes(material.category.toLowerCase())
      )?.category;

      if (matchedCategory) {
        materialParams.set("category", matchedCategory);
      }

      viewMatches.push({
        key: `view-materials-${materialParams.toString() || "all"}`,
        name: "Open materials directory",
        href: materialParams.toString() ? `/materials?${materialParams.toString()}` : "/materials",
        type: "View",
        meta: matchedCategory
          ? `Prefilled materials filter (${matchedCategory})`
          : "Browse material pages with filters",
      });
    }

    if (
      normalizedQuery.includes("compare") ||
      normalizedQuery.includes("vs") ||
      normalizedQuery.includes("versus")
    ) {
      viewMatches.push({
        key: "view-compare",
        name: "Open compare view",
        href: "/compare",
        type: "View",
        meta: "Country-vs-country and material-vs-material analysis",
      });
    }

    if (
      normalizedQuery.includes("method") ||
      normalizedQuery.includes("confidence") ||
      normalizedQuery.includes("source")
    ) {
      viewMatches.push({
        key: "view-methodology",
        name: "Open methodology",
        href: "/methodology",
        type: "View",
        meta: "Source, freshness, and confidence rules",
      });
    }

    const vsMatch = normalizedQuery.match(/^(.+?)\s+(?:vs|versus)\s+(.+)$/i);
    if (vsMatch) {
      const left = vsMatch[1];
      const right = vsMatch[2];

      const leftCountrySlug = findCountrySlugByQuery(left);
      const rightCountrySlug = findCountrySlugByQuery(right);
      const leftMaterialSlug = findMaterialSlugByQuery(left);
      const rightMaterialSlug = findMaterialSlugByQuery(right);

      if (leftCountrySlug && rightCountrySlug && leftCountrySlug !== rightCountrySlug) {
        const params = new URLSearchParams({
          leftCountry: leftCountrySlug,
          rightCountry: rightCountrySlug,
        });

        viewMatches.push({
          key: `view-compare-country-${leftCountrySlug}-${rightCountrySlug}`,
          name: `Compare countries: ${left.trim()} vs ${right.trim()}`,
          href: `/compare?${params.toString()}`,
          type: "View",
          meta: "Prefilled country comparison",
        });
      }

      if (leftMaterialSlug && rightMaterialSlug && leftMaterialSlug !== rightMaterialSlug) {
        const params = new URLSearchParams({
          leftMaterial: leftMaterialSlug,
          rightMaterial: rightMaterialSlug,
        });

        viewMatches.push({
          key: `view-compare-material-${leftMaterialSlug}-${rightMaterialSlug}`,
          name: `Compare materials: ${left.trim()} vs ${right.trim()}`,
          href: `/compare?${params.toString()}`,
          type: "View",
          meta: "Prefilled material comparison",
        });
      }
    }

    return [...viewMatches, ...materialMatches, ...countryMatches]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 14);
  }, [query]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Explorer command center"
        title="Jump directly to country and material detail pages"
        description="Search by country, material, category, or product keyword. Use ‘X vs Y’ to open a prefilled compare view."
      />

      <label>
        Search countries and materials
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="lithium, chile, fertilizer, copper, chile vs peru..."
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
