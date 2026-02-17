"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../components";
import { getCountryProfiles } from "../../lib/countries";
import { rawMaterials } from "../../lib/raw-materials";

const countries = getCountryProfiles();

function getMaterialStats(slug: string) {
  const material = rawMaterials.find((item) => item.slug === slug);
  if (!material) return null;

  const sorted = [...material.dataPoints].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const total = sorted.reduce((acc, point) => acc + point.value, 0);

  return {
    material,
    top,
    total,
  };
}

export default function ComparePage() {
  const [leftCountrySlug, setLeftCountrySlug] = useState(countries[0]?.slug ?? "");
  const [rightCountrySlug, setRightCountrySlug] = useState(
    countries[1]?.slug ?? countries[0]?.slug ?? ""
  );

  const [leftMaterialSlug, setLeftMaterialSlug] = useState(rawMaterials[0]?.slug ?? "");
  const [rightMaterialSlug, setRightMaterialSlug] = useState(
    rawMaterials[1]?.slug ?? rawMaterials[0]?.slug ?? ""
  );

  const leftCountry = useMemo(
    () => countries.find((item) => item.slug === leftCountrySlug) ?? null,
    [leftCountrySlug]
  );
  const rightCountry = useMemo(
    () => countries.find((item) => item.slug === rightCountrySlug) ?? null,
    [rightCountrySlug]
  );

  const leftMaterial = useMemo(() => getMaterialStats(leftMaterialSlug), [leftMaterialSlug]);
  const rightMaterial = useMemo(() => getMaterialStats(rightMaterialSlug), [rightMaterialSlug]);

  const countryComparison = useMemo(() => {
    if (!leftCountry || !rightCountry) {
      return null;
    }

    const importerDelta =
      leftCountry.roleBreakdown.importerCount - rightCountry.roleBreakdown.importerCount;
    const exporterDelta =
      leftCountry.roleBreakdown.exporterCount - rightCountry.roleBreakdown.exporterCount;
    const flowDelta = leftCountry.roleBreakdown.totalFlows - rightCountry.roleBreakdown.totalFlows;

    return { importerDelta, exporterDelta, flowDelta };
  }, [leftCountry, rightCountry]);

  const materialComparison = useMemo(() => {
    if (!leftMaterial || !rightMaterial) {
      return null;
    }

    const sameUnit = leftMaterial.top.unit === rightMaterial.top.unit;

    return {
      sameUnit,
      totalDelta: leftMaterial.total - rightMaterial.total,
      topProducerGap: leftMaterial.top.value - rightMaterial.top.value,
    };
  }, [leftMaterial, rightMaterial]);

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Compare view</Pill>
        <h1>Country and material comparison</h1>
        <p>Side-by-side explorer view for country roles and source-cited material records.</p>
        <p>
          <Link href="/">← Back to explorer</Link>
        </p>
      </header>

      <Card>
        <SectionHeader
          eyebrow="Country vs country"
          title="Role breakdown and partner concentration"
          description="Compare importer/exporter participation and top counterparties in the current dataset."
        />

        <div className="gridTwo">
          <label>
            Left country
            <select value={leftCountrySlug} onChange={(e) => setLeftCountrySlug(e.target.value)}>
              {countries.map((country) => (
                <option key={country.slug} value={country.slug}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Right country
            <select value={rightCountrySlug} onChange={(e) => setRightCountrySlug(e.target.value)}>
              {countries.map((country) => (
                <option key={country.slug} value={country.slug}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="compareColumns">
          {[leftCountry, rightCountry].map((country) =>
            country ? (
              <article key={country.slug} className="card comparePanel">
                <h3>{country.name}</h3>
                <StatGrid>
                  <StatCard
                    label="Importer roles"
                    value={String(country.roleBreakdown.importerCount)}
                  />
                  <StatCard
                    label="Exporter roles"
                    value={String(country.roleBreakdown.exporterCount)}
                  />
                  <StatCard
                    label="Unique products"
                    value={String(country.roleBreakdown.totalFlows)}
                  />
                  <StatCard label="Top partners" value={String(country.topPartners.length)} />
                </StatGrid>
                <p className="sectionIntro">
                  <Link href={`/countries/${country.slug}`}>Open full country detail →</Link>
                </p>
              </article>
            ) : null
          )}
        </div>

        {countryComparison && leftCountry && rightCountry ? (
          <div className="spotlightGrid">
            <article className="statCard">
              <p className="statLabel">Importer role delta</p>
              <p className="statValue">
                {countryComparison.importerDelta >= 0 ? "+" : ""}
                {countryComparison.importerDelta}
              </p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
            <article className="statCard">
              <p className="statLabel">Exporter role delta</p>
              <p className="statValue">
                {countryComparison.exporterDelta >= 0 ? "+" : ""}
                {countryComparison.exporterDelta}
              </p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
            <article className="statCard">
              <p className="statLabel">Unique product delta</p>
              <p className="statValue">
                {countryComparison.flowDelta >= 0 ? "+" : ""}
                {countryComparison.flowDelta}
              </p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Material vs material"
          title="Exact value and source comparison"
          description="Compare current top producer and total captured value by material."
        />

        <div className="gridTwo">
          <label>
            Left material
            <select value={leftMaterialSlug} onChange={(e) => setLeftMaterialSlug(e.target.value)}>
              {rawMaterials.map((material) => (
                <option key={material.slug} value={material.slug}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Right material
            <select
              value={rightMaterialSlug}
              onChange={(e) => setRightMaterialSlug(e.target.value)}
            >
              {rawMaterials.map((material) => (
                <option key={material.slug} value={material.slug}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="compareColumns">
          {[leftMaterial, rightMaterial].map((item) =>
            item ? (
              <article key={item.material.slug} className="card comparePanel">
                <h3>{item.material.name}</h3>
                <StatGrid>
                  <StatCard label="Category" value={item.material.category} />
                  <StatCard label="Records" value={String(item.material.dataPoints.length)} />
                  <StatCard
                    label="Top producer"
                    value={`${item.top.country} (${item.top.value.toLocaleString()} ${item.top.unit})`}
                    hint={`Year ${item.top.year}`}
                  />
                  <StatCard
                    label="Total captured"
                    value={`${item.total.toLocaleString()} ${item.top.unit}`}
                    hint="Current record set"
                  />
                </StatGrid>
                <p className="sectionIntro">
                  Source: <a href={item.top.sourceUrl}>{item.top.sourceName}</a>
                </p>
                <p className="sectionIntro">
                  <Link href={`/materials/${item.material.slug}`}>Open full material detail →</Link>
                </p>
              </article>
            ) : null
          )}
        </div>

        {materialComparison && leftMaterial && rightMaterial ? (
          <div className="spotlightGrid">
            <article className="statCard">
              <p className="statLabel">Total captured delta</p>
              <p className="statValue">
                {materialComparison.totalDelta >= 0 ? "+" : ""}
                {materialComparison.totalDelta.toLocaleString()}
                {materialComparison.sameUnit ? ` ${leftMaterial.top.unit}` : ""}
              </p>
              <p className="statHint">
                {leftMaterial.material.name} vs {rightMaterial.material.name}
                {materialComparison.sameUnit ? "" : " (unit-aware reading required)"}
              </p>
            </article>
            <article className="statCard">
              <p className="statLabel">Top producer value gap</p>
              <p className="statValue">
                {materialComparison.topProducerGap >= 0 ? "+" : ""}
                {materialComparison.topProducerGap.toLocaleString()}
                {materialComparison.sameUnit ? ` ${leftMaterial.top.unit}` : ""}
              </p>
              <p className="statHint">
                {leftMaterial.top.country} vs {rightMaterial.top.country}
                {materialComparison.sameUnit ? "" : " (different units)"}
              </p>
            </article>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
