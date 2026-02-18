"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../components";
import { getCountryProfiles } from "../../lib/countries";
import { getDataPointConfidence, getFreshnessLabel, rawMaterials } from "../../lib/raw-materials";

const countries = getCountryProfiles();

function pickSlugFromQuery(
  candidate: string | null,
  validSlugs: string[],
  fallback: string
): string {
  if (!candidate) {
    return fallback;
  }

  return validSlugs.includes(candidate) ? candidate : fallback;
}

function getMaterialStats(slug: string) {
  const material = rawMaterials.find((item) => item.slug === slug);
  if (!material) return null;

  const sorted = [...material.dataPoints].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const total = sorted.reduce((acc, point) => acc + point.value, 0);
  const latestYear = Math.max(...material.dataPoints.map((point) => point.year));
  const highConfidenceCount = material.dataPoints.filter(
    (point) => getDataPointConfidence(point) === "High"
  ).length;
  const currentOrRecentCount = material.dataPoints.filter((point) => {
    const freshness = getFreshnessLabel(point.year, material.updatedAt);
    return freshness === "Current" || freshness === "Recent";
  }).length;
  const uniqueSourceCount = new Set(material.dataPoints.map((point) => point.sourceUrl)).size;

  return {
    material,
    top,
    total,
    latestYear,
    highConfidenceCount,
    currentOrRecentCount,
    uniqueSourceCount,
  };
}

function formatSignedDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export default function ComparePage() {
  const countrySlugs = countries.map((country) => country.slug);
  const materialSlugs = rawMaterials.map((material) => material.slug);

  const defaultLeftCountry = countries[0]?.slug ?? "";
  const defaultRightCountry = countries[1]?.slug ?? countries[0]?.slug ?? "";
  const defaultLeftMaterial = rawMaterials[0]?.slug ?? "";
  const defaultRightMaterial = rawMaterials[1]?.slug ?? rawMaterials[0]?.slug ?? "";

  const [leftCountrySlug, setLeftCountrySlug] = useState(defaultLeftCountry);
  const [rightCountrySlug, setRightCountrySlug] = useState(defaultRightCountry);

  const [leftMaterialSlug, setLeftMaterialSlug] = useState(defaultLeftMaterial);
  const [rightMaterialSlug, setRightMaterialSlug] = useState(defaultRightMaterial);

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
    const sameMetric = leftMaterial.top.metric === rightMaterial.top.metric;
    const directlyComparable = sameUnit && sameMetric;

    return {
      sameUnit,
      sameMetric,
      directlyComparable,
      totalDelta: directlyComparable ? leftMaterial.total - rightMaterial.total : null,
      topProducerGap: directlyComparable ? leftMaterial.top.value - rightMaterial.top.value : null,
    };
  }, [leftMaterial, rightMaterial]);

  const countryOverlap = useMemo(() => {
    if (!leftCountry || !rightCountry) {
      return null;
    }

    const leftProducts = new Set(leftCountry.products.map((item) => item.product));
    const sharedProducts = rightCountry.products
      .map((item) => item.product)
      .filter((product, index, arr) => leftProducts.has(product) && arr.indexOf(product) === index)
      .sort((a, b) => a.localeCompare(b));

    const leftPartners = new Set(leftCountry.topPartners.map((partner) => partner.name));
    const sharedPartners = rightCountry.topPartners
      .map((partner) => partner.name)
      .filter((name, index, arr) => leftPartners.has(name) && arr.indexOf(name) === index)
      .sort((a, b) => a.localeCompare(b));

    return {
      sharedProducts,
      sharedPartners,
      exclusiveProductsLeft: leftProducts.size - sharedProducts.length,
      exclusiveProductsRight:
        new Set(rightCountry.products.map((item) => item.product)).size - sharedProducts.length,
    };
  }, [leftCountry, rightCountry]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    setLeftCountrySlug(
      pickSlugFromQuery(params.get("leftCountry"), countrySlugs, defaultLeftCountry)
    );
    setRightCountrySlug(
      pickSlugFromQuery(params.get("rightCountry"), countrySlugs, defaultRightCountry)
    );
    setLeftMaterialSlug(
      pickSlugFromQuery(params.get("leftMaterial"), materialSlugs, defaultLeftMaterial)
    );
    setRightMaterialSlug(
      pickSlugFromQuery(params.get("rightMaterial"), materialSlugs, defaultRightMaterial)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("leftCountry", leftCountrySlug);
    params.set("rightCountry", rightCountrySlug);
    params.set("leftMaterial", leftMaterialSlug);
    params.set("rightMaterial", rightMaterialSlug);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [leftCountrySlug, rightCountrySlug, leftMaterialSlug, rightMaterialSlug]);

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

        <p className="sectionIntro">
          <button
            type="button"
            onClick={() => {
              setLeftCountrySlug(rightCountrySlug);
              setRightCountrySlug(leftCountrySlug);
            }}
          >
            Swap countries
          </button>
        </p>

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
              <p className="statValue">{formatSignedDelta(countryComparison.importerDelta)}</p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
            <article className="statCard">
              <p className="statLabel">Exporter role delta</p>
              <p className="statValue">{formatSignedDelta(countryComparison.exporterDelta)}</p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
            <article className="statCard">
              <p className="statLabel">Unique product delta</p>
              <p className="statValue">{formatSignedDelta(countryComparison.flowDelta)}</p>
              <p className="statHint">
                {leftCountry.name} vs {rightCountry.name}
              </p>
            </article>
          </div>
        ) : null}

        {countryOverlap && leftCountry && rightCountry ? (
          <div className="spotlightGrid">
            <article className="statCard">
              <p className="statLabel">Shared products</p>
              <p className="statValue">{countryOverlap.sharedProducts.length}</p>
              <p className="statHint">
                {leftCountry.name} and {rightCountry.name}
              </p>
              {countryOverlap.sharedProducts.length > 0 ? (
                <ul className="miniList">
                  {countryOverlap.sharedProducts.slice(0, 6).map((product) => (
                    <li key={product}>{product}</li>
                  ))}
                </ul>
              ) : null}
            </article>

            <article className="statCard">
              <p className="statLabel">Shared top partners</p>
              <p className="statValue">{countryOverlap.sharedPartners.length}</p>
              <p className="statHint">Overlap in current top counterparties</p>
              {countryOverlap.sharedPartners.length > 0 ? (
                <ul className="miniList">
                  {countryOverlap.sharedPartners.slice(0, 6).map((partner) => (
                    <li key={partner}>{partner}</li>
                  ))}
                </ul>
              ) : null}
            </article>

            <article className="statCard">
              <p className="statLabel">Exclusive products</p>
              <p className="statValue">
                {countryOverlap.exclusiveProductsLeft} vs {countryOverlap.exclusiveProductsRight}
              </p>
              <p className="statHint">
                {leftCountry.name} unique set vs {rightCountry.name} unique set
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

        <p className="sectionIntro">
          <button
            type="button"
            onClick={() => {
              setLeftMaterialSlug(rightMaterialSlug);
              setRightMaterialSlug(leftMaterialSlug);
            }}
          >
            Swap materials
          </button>
        </p>

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
                  <StatCard label="Latest year" value={String(item.latestYear)} />
                  <StatCard
                    label="High-confidence records"
                    value={`${item.highConfidenceCount}/${item.material.dataPoints.length}`}
                    hint="Source + unit + year completeness"
                  />
                  <StatCard
                    label="Current/recent records"
                    value={`${item.currentOrRecentCount}/${item.material.dataPoints.length}`}
                    hint="Freshness from updated dataset"
                  />
                  <StatCard
                    label="Unique sources"
                    value={String(item.uniqueSourceCount)}
                    hint="Distinct citation links"
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
              {materialComparison.directlyComparable && materialComparison.totalDelta !== null ? (
                <>
                  <p className="statValue">
                    {materialComparison.totalDelta >= 0 ? "+" : ""}
                    {materialComparison.totalDelta.toLocaleString()} {leftMaterial.top.unit}
                  </p>
                  <p className="statHint">
                    {leftMaterial.material.name} vs {rightMaterial.material.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="statValue">Not directly comparable</p>
                  <p className="statHint">
                    Left: {leftMaterial.top.metric} ({leftMaterial.top.unit}) · Right:{" "}
                    {rightMaterial.top.metric} ({rightMaterial.top.unit})
                  </p>
                </>
              )}
            </article>
            <article className="statCard">
              <p className="statLabel">Top producer value gap</p>
              {materialComparison.directlyComparable &&
              materialComparison.topProducerGap !== null ? (
                <>
                  <p className="statValue">
                    {materialComparison.topProducerGap >= 0 ? "+" : ""}
                    {materialComparison.topProducerGap.toLocaleString()} {leftMaterial.top.unit}
                  </p>
                  <p className="statHint">
                    {leftMaterial.top.country} vs {rightMaterial.top.country}
                  </p>
                </>
              ) : (
                <>
                  <p className="statValue">Not directly comparable</p>
                  <p className="statHint">
                    Compare materials with the same metric and unit for exact deltas.
                  </p>
                </>
              )}
            </article>
            <article className="statCard">
              <p className="statLabel">Data quality readiness</p>
              <p className="statValue">
                {leftMaterial.highConfidenceCount}/{leftMaterial.material.dataPoints.length} vs{" "}
                {rightMaterial.highConfidenceCount}/{rightMaterial.material.dataPoints.length}
              </p>
              <p className="statHint">
                High-confidence records · {leftMaterial.material.name} vs{" "}
                {rightMaterial.material.name}
              </p>
            </article>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
