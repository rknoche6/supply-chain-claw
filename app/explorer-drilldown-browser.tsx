"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionHeader } from "./components";
import { getCountryProfiles } from "../lib/countries";
import { rawMaterials } from "../lib/raw-materials";

const countries = getCountryProfiles();

function scoreMatch(name: string, query: string) {
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedName.startsWith(normalizedQuery)) {
    return 2;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 1;
  }

  return 0;
}

export default function ExplorerDrilldownBrowser() {
  const [materialQuery, setMaterialQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const visibleMaterials = useMemo(() => {
    const query = materialQuery.trim().toLowerCase();

    const ranked = rawMaterials
      .map((material) => ({
        material,
        score: query.length > 0 ? scoreMatch(material.name, query) : 1,
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        return (
          b.score - a.score ||
          b.material.dataPoints.length - a.material.dataPoints.length ||
          a.material.name.localeCompare(b.material.name)
        );
      });

    return ranked.slice(0, 12).map((entry) => entry.material);
  }, [materialQuery]);

  const visibleCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();

    const ranked = countries
      .map((country) => ({
        country,
        score: query.length > 0 ? scoreMatch(country.name, query) : 1,
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        return (
          b.score - a.score ||
          b.country.roleBreakdown.totalFlows - a.country.roleBreakdown.totalFlows ||
          a.country.name.localeCompare(b.country.name)
        );
      });

    return ranked.slice(0, 12).map((entry) => entry.country);
  }, [countryQuery]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Drilldown browser"
        title="Find detail pages quickly"
        description="Search and open country/material pages directly from the explorer command center."
      />

      <div className="gridTwo">
        <div>
          <label>
            Search materials
            <input
              type="search"
              value={materialQuery}
              onChange={(event) => setMaterialQuery(event.target.value)}
              placeholder="Try: copper, lithium, bauxite"
            />
          </label>
          <p className="sectionIntro">Showing {visibleMaterials.length} material matches.</p>
          <div className="linkChipList">
            {visibleMaterials.map((material) => (
              <Link
                key={`material-drilldown-${material.slug}`}
                href={`/materials/${material.slug}`}
                className="linkChip"
              >
                <span>{material.name}</span>
                <span>{material.dataPoints.length} records</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <label>
            Search countries
            <input
              type="search"
              value={countryQuery}
              onChange={(event) => setCountryQuery(event.target.value)}
              placeholder="Try: chile, china, australia"
            />
          </label>
          <p className="sectionIntro">Showing {visibleCountries.length} country matches.</p>
          <div className="linkChipList">
            {visibleCountries.map((country) => (
              <Link
                key={`country-drilldown-${country.slug}`}
                href={`/countries/${country.slug}`}
                className="linkChip"
              >
                <span>{country.name}</span>
                <span>{country.roleBreakdown.totalFlows} flows</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
