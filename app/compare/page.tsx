"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Container, Pill, SectionHeader, StatCard, StatGrid } from "../components";
import { getCountryProfiles, type CountryMaterialRecord } from "../../lib/countries";
import { getDataPointConfidence, getFreshnessLabel, rawMaterials } from "../../lib/raw-materials";

type SharedMaterialSort =
  | "material"
  | "delta-desc"
  | "delta-asc"
  | "delta-percent-desc"
  | "delta-percent-asc"
  | "left-value"
  | "right-value";

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

function pickBooleanFromQuery(candidate: string | null, fallback: boolean): boolean {
  if (candidate === null) {
    return fallback;
  }

  return candidate === "1" || candidate.toLowerCase() === "true";
}

function pickSharedMaterialSort(candidate: string | null): SharedMaterialSort {
  switch (candidate) {
    case "delta-desc":
    case "delta-asc":
    case "delta-percent-desc":
    case "delta-percent-asc":
    case "left-value":
    case "right-value":
      return candidate;
    default:
      return "material";
  }
}

function pickTextFromQuery(candidate: string | null, fallback: string): string {
  if (candidate === null) {
    return fallback;
  }

  return candidate;
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

function getLatestRecordByMaterial(records: CountryMaterialRecord[]) {
  const latestByMaterial = new Map<string, CountryMaterialRecord>();

  for (const record of records) {
    const existing = latestByMaterial.get(record.materialSlug);

    if (
      !existing ||
      record.year > existing.year ||
      (record.year === existing.year && record.value > existing.value)
    ) {
      latestByMaterial.set(record.materialSlug, record);
    }
  }

  return latestByMaterial;
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
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);
  const [matchedYearOnly, setMatchedYearOnly] = useState(false);
  const [comparableOnly, setComparableOnly] = useState(false);
  const [sameCitationOnly, setSameCitationOnly] = useState(false);
  const [sharedMaterialQuery, setSharedMaterialQuery] = useState("");
  const [sharedMaterialSort, setSharedMaterialSort] = useState<SharedMaterialSort>("material");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

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

  const countryMaterialComparison = useMemo(() => {
    if (!leftCountry || !rightCountry) {
      return null;
    }

    const leftScopedRecords = highConfidenceOnly
      ? leftCountry.materialRecords.filter((record) => record.confidence === "High")
      : leftCountry.materialRecords;
    const rightScopedRecords = highConfidenceOnly
      ? rightCountry.materialRecords.filter((record) => record.confidence === "High")
      : rightCountry.materialRecords;

    const leftHighConfidence = leftCountry.materialRecords.filter(
      (record) => record.confidence === "High"
    ).length;
    const rightHighConfidence = rightCountry.materialRecords.filter(
      (record) => record.confidence === "High"
    ).length;

    const leftLatestYear = leftScopedRecords.length
      ? Math.max(...leftScopedRecords.map((record) => record.year))
      : null;
    const rightLatestYear = rightScopedRecords.length
      ? Math.max(...rightScopedRecords.map((record) => record.year))
      : null;

    const leftLatestByMaterial = getLatestRecordByMaterial(leftScopedRecords);
    const rightLatestByMaterial = getLatestRecordByMaterial(rightScopedRecords);

    const allSharedMaterialRows = Array.from(leftLatestByMaterial.entries())
      .filter(([materialSlug]) => rightLatestByMaterial.has(materialSlug))
      .map(([materialSlug, leftRecord]) => {
        const rightRecord = rightLatestByMaterial.get(materialSlug)!;
        const directlyComparable =
          leftRecord.metric === rightRecord.metric && leftRecord.unit === rightRecord.unit;
        const yearMatched = leftRecord.year === rightRecord.year;

        const delta = directlyComparable ? leftRecord.value - rightRecord.value : null;
        const deltaPercent =
          directlyComparable && rightRecord.value !== 0 && delta !== null
            ? delta / rightRecord.value
            : null;
        const sameSourceCitation = leftRecord.sourceUrl === rightRecord.sourceUrl;

        return {
          materialSlug,
          materialName: leftRecord.materialName,
          leftRecord,
          rightRecord,
          directlyComparable,
          yearMatched,
          sameSourceCitation,
          delta,
          deltaPercent,
        };
      })
      .sort((a, b) => a.materialName.localeCompare(b.materialName));

    const yearScopedRows = matchedYearOnly
      ? allSharedMaterialRows.filter((row) => row.yearMatched)
      : allSharedMaterialRows;

    const comparableRows = comparableOnly
      ? yearScopedRows.filter((row) => row.directlyComparable)
      : yearScopedRows;

    const citationScopedRows = sameCitationOnly
      ? comparableRows.filter((row) => row.sameSourceCitation)
      : comparableRows;

    const query = sharedMaterialQuery.trim().toLowerCase();

    const searchedRows = query
      ? citationScopedRows.filter((row) => row.materialName.toLowerCase().includes(query))
      : citationScopedRows;

    const sharedMaterialRows = [...searchedRows].sort((a, b) => {
      if (sharedMaterialSort === "delta-desc") {
        const left = a.delta ?? Number.NEGATIVE_INFINITY;
        const right = b.delta ?? Number.NEGATIVE_INFINITY;
        return right - left || a.materialName.localeCompare(b.materialName);
      }

      if (sharedMaterialSort === "delta-asc") {
        const left = a.delta ?? Number.POSITIVE_INFINITY;
        const right = b.delta ?? Number.POSITIVE_INFINITY;
        return left - right || a.materialName.localeCompare(b.materialName);
      }

      if (sharedMaterialSort === "delta-percent-desc") {
        const left = a.deltaPercent ?? Number.NEGATIVE_INFINITY;
        const right = b.deltaPercent ?? Number.NEGATIVE_INFINITY;
        return right - left || a.materialName.localeCompare(b.materialName);
      }

      if (sharedMaterialSort === "delta-percent-asc") {
        const left = a.deltaPercent ?? Number.POSITIVE_INFINITY;
        const right = b.deltaPercent ?? Number.POSITIVE_INFINITY;
        return left - right || a.materialName.localeCompare(b.materialName);
      }

      if (sharedMaterialSort === "left-value") {
        return (
          b.leftRecord.value - a.leftRecord.value || a.materialName.localeCompare(b.materialName)
        );
      }

      if (sharedMaterialSort === "right-value") {
        return (
          b.rightRecord.value - a.rightRecord.value || a.materialName.localeCompare(b.materialName)
        );
      }

      return a.materialName.localeCompare(b.materialName);
    });

    const comparableSharedCount = allSharedMaterialRows.filter(
      (row) => row.directlyComparable
    ).length;

    return {
      leftHighConfidence,
      rightHighConfidence,
      leftLatestYear,
      rightLatestYear,
      leftSourceCount: new Set(leftScopedRecords.map((record) => record.sourceUrl)).size,
      rightSourceCount: new Set(rightScopedRecords.map((record) => record.sourceUrl)).size,
      leftMaterialCount: new Set(leftScopedRecords.map((record) => record.materialSlug)).size,
      rightMaterialCount: new Set(rightScopedRecords.map((record) => record.materialSlug)).size,
      leftScopedRecordCount: leftScopedRecords.length,
      rightScopedRecordCount: rightScopedRecords.length,
      sharedMaterialRows,
      comparableSharedCount,
      sameSourceSharedCount: allSharedMaterialRows.filter((row) => row.sameSourceCitation).length,
      allSharedMaterialCount: allSharedMaterialRows.length,
      matchedYearSharedCount: allSharedMaterialRows.filter((row) => row.yearMatched).length,
      searchMatchedCount: searchedRows.length,
    };
  }, [
    highConfidenceOnly,
    leftCountry,
    matchedYearOnly,
    comparableOnly,
    sameCitationOnly,
    rightCountry,
    sharedMaterialQuery,
    sharedMaterialSort,
  ]);

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
    setHighConfidenceOnly(pickBooleanFromQuery(params.get("highConfidenceOnly"), false));
    setMatchedYearOnly(pickBooleanFromQuery(params.get("matchedYearOnly"), false));
    setComparableOnly(pickBooleanFromQuery(params.get("comparableOnly"), false));
    setSameCitationOnly(pickBooleanFromQuery(params.get("sameCitationOnly"), false));
    setSharedMaterialSort(pickSharedMaterialSort(params.get("sharedMaterialSort")));
    setSharedMaterialQuery(pickTextFromQuery(params.get("sharedMaterialQuery"), ""));
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

    if (highConfidenceOnly) {
      params.set("highConfidenceOnly", "1");
    } else {
      params.delete("highConfidenceOnly");
    }

    if (matchedYearOnly) {
      params.set("matchedYearOnly", "1");
    } else {
      params.delete("matchedYearOnly");
    }

    if (comparableOnly) {
      params.set("comparableOnly", "1");
    } else {
      params.delete("comparableOnly");
    }

    if (sameCitationOnly) {
      params.set("sameCitationOnly", "1");
    } else {
      params.delete("sameCitationOnly");
    }

    if (sharedMaterialSort !== "material") {
      params.set("sharedMaterialSort", sharedMaterialSort);
    } else {
      params.delete("sharedMaterialSort");
    }

    if (sharedMaterialQuery.trim().length > 0) {
      params.set("sharedMaterialQuery", sharedMaterialQuery.trim());
    } else {
      params.delete("sharedMaterialQuery");
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [
    leftCountrySlug,
    rightCountrySlug,
    leftMaterialSlug,
    rightMaterialSlug,
    highConfidenceOnly,
    matchedYearOnly,
    comparableOnly,
    sameCitationOnly,
    sharedMaterialSort,
    sharedMaterialQuery,
  ]);

  const compareParams = useMemo(() => {
    const params = new URLSearchParams({
      leftCountry: leftCountrySlug,
      rightCountry: rightCountrySlug,
      leftMaterial: leftMaterialSlug,
      rightMaterial: rightMaterialSlug,
    });

    if (highConfidenceOnly) {
      params.set("highConfidenceOnly", "1");
    }

    if (matchedYearOnly) {
      params.set("matchedYearOnly", "1");
    }

    if (comparableOnly) {
      params.set("comparableOnly", "1");
    }

    if (sameCitationOnly) {
      params.set("sameCitationOnly", "1");
    }

    if (sharedMaterialSort !== "material") {
      params.set("sharedMaterialSort", sharedMaterialSort);
    }

    if (sharedMaterialQuery.trim().length > 0) {
      params.set("sharedMaterialQuery", sharedMaterialQuery.trim());
    }

    return params;
  }, [
    leftCountrySlug,
    rightCountrySlug,
    leftMaterialSlug,
    rightMaterialSlug,
    highConfidenceOnly,
    matchedYearOnly,
    comparableOnly,
    sameCitationOnly,
    sharedMaterialSort,
    sharedMaterialQuery,
  ]);

  const comparePath = `/compare?${compareParams.toString()}`;

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      setShareStatus("failed");
      return;
    }

    const url = `${window.location.origin}${comparePath}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2500);
    } catch {
      setShareStatus("failed");
      window.setTimeout(() => setShareStatus("idle"), 2500);
    }
  };

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Compare view</Pill>
        <h1>Country and material comparison</h1>
        <p>Side-by-side explorer view for country roles and source-cited material records.</p>
        <div className="filterActions">
          <button type="button" className="secondaryButton" onClick={handleCopyShareLink}>
            Copy current compare link
          </button>
          {shareStatus === "copied" ? <span className="sectionIntro">Link copied.</span> : null}
          {shareStatus === "failed" ? (
            <span className="sectionIntro">Could not copy link automatically.</span>
          ) : null}
        </div>
        <p className="sectionIntro">
          Share URL: <Link href={comparePath}>{comparePath}</Link>
        </p>
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

        {countryMaterialComparison && leftCountry && rightCountry ? (
          <>
            <SectionHeader
              eyebrow="Material data in selected countries"
              title="Country-level source-cited material comparison"
              description="Latest exact values by material, with unit/year/source checks for direct comparability."
            />

            <div className="filterActions">
              <button
                type="button"
                className={`secondaryButton ${highConfidenceOnly ? "isActive" : ""}`}
                onClick={() => setHighConfidenceOnly((prev) => !prev)}
              >
                {highConfidenceOnly ? "Showing High-confidence only" : "Show High-confidence only"}
              </button>
              <button
                type="button"
                className={`secondaryButton ${matchedYearOnly ? "isActive" : ""}`}
                onClick={() => setMatchedYearOnly((prev) => !prev)}
              >
                {matchedYearOnly
                  ? "Showing matched-year records"
                  : "Show matched-year records only"}
              </button>
              <button
                type="button"
                className={`secondaryButton ${comparableOnly ? "isActive" : ""}`}
                onClick={() => setComparableOnly((prev) => !prev)}
              >
                {comparableOnly
                  ? "Showing directly comparable rows"
                  : "Show directly comparable rows only"}
              </button>
              <button
                type="button"
                className={`secondaryButton ${sameCitationOnly ? "isActive" : ""}`}
                onClick={() => setSameCitationOnly((prev) => !prev)}
              >
                {sameCitationOnly ? "Showing same-citation rows" : "Show same-citation rows only"}
              </button>
              <label>
                Row sort
                <select
                  value={sharedMaterialSort}
                  onChange={(event) =>
                    setSharedMaterialSort(event.target.value as SharedMaterialSort)
                  }
                >
                  <option value="material">Material A-Z</option>
                  <option value="delta-desc">Largest positive delta</option>
                  <option value="delta-asc">Largest negative delta</option>
                  <option value="delta-percent-desc">Largest positive delta (%)</option>
                  <option value="delta-percent-asc">Largest negative delta (%)</option>
                  <option value="left-value">Highest left-country value</option>
                  <option value="right-value">Highest right-country value</option>
                </select>
              </label>
              <label>
                Material search
                <input
                  type="search"
                  value={sharedMaterialQuery}
                  onChange={(event) => setSharedMaterialQuery(event.target.value)}
                  placeholder="Filter shared materials"
                />
              </label>
              {sharedMaterialQuery.trim().length > 0 ? (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => setSharedMaterialQuery("")}
                >
                  Clear search
                </button>
              ) : null}
            </div>

            <StatGrid>
              <StatCard
                label={`${leftCountry.name} materials`}
                value={String(countryMaterialComparison.leftMaterialCount)}
                hint={`Latest year ${countryMaterialComparison.leftLatestYear ?? "—"}`}
              />
              <StatCard
                label={`${rightCountry.name} materials`}
                value={String(countryMaterialComparison.rightMaterialCount)}
                hint={`Latest year ${countryMaterialComparison.rightLatestYear ?? "—"}`}
              />
              <StatCard
                label="High-confidence records"
                value={`${countryMaterialComparison.leftHighConfidence}/${leftCountry.materialRecords.length} vs ${countryMaterialComparison.rightHighConfidence}/${rightCountry.materialRecords.length}`}
                hint={`${leftCountry.name} vs ${rightCountry.name}`}
              />
              <StatCard
                label="Records in current confidence scope"
                value={`${countryMaterialComparison.leftScopedRecordCount} vs ${countryMaterialComparison.rightScopedRecordCount}`}
                hint={highConfidenceOnly ? "High-confidence scope" : "All confidence levels"}
              />
              <StatCard
                label="Distinct source links"
                value={`${countryMaterialComparison.leftSourceCount} vs ${countryMaterialComparison.rightSourceCount}`}
                hint={`${leftCountry.name} vs ${rightCountry.name}`}
              />
              <StatCard
                label="Shared rows with same citation"
                value={`${countryMaterialComparison.sameSourceSharedCount}/${countryMaterialComparison.allSharedMaterialCount}`}
                hint="Rows where left/right records point to the same source URL"
              />
              <StatCard
                label="Shared materials"
                value={String(countryMaterialComparison.sharedMaterialRows.length)}
                hint={
                  sharedMaterialQuery.trim().length > 0
                    ? `Search matches ${countryMaterialComparison.searchMatchedCount}/${countryMaterialComparison.allSharedMaterialCount}`
                    : sameCitationOnly
                      ? `Same-citation view (${countryMaterialComparison.sameSourceSharedCount}/${countryMaterialComparison.allSharedMaterialCount})`
                      : comparableOnly
                        ? `Directly comparable view (${countryMaterialComparison.comparableSharedCount}/${countryMaterialComparison.allSharedMaterialCount})`
                        : matchedYearOnly
                          ? `Matched-year view (${countryMaterialComparison.matchedYearSharedCount}/${countryMaterialComparison.allSharedMaterialCount})`
                          : "Materials with records in both selected countries"
                }
              />
            </StatGrid>

            {countryMaterialComparison.sharedMaterialRows.length > 0 ? (
              <div className="tableWrap">
                <table className="flowTable">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>{leftCountry.name}</th>
                      <th>{rightCountry.name}</th>
                      <th>Delta</th>
                      <th>Delta %</th>
                      <th>Year alignment</th>
                      <th>Citation alignment</th>
                      <th>Data quality</th>
                      <th>Left source</th>
                      <th>Right source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryMaterialComparison.sharedMaterialRows.map((row) => (
                      <tr key={`${leftCountry.slug}-${rightCountry.slug}-${row.materialSlug}`}>
                        <td>
                          <Link href={`/materials/${row.materialSlug}`}>{row.materialName}</Link>
                        </td>
                        <td>
                          {row.leftRecord.value.toLocaleString()} {row.leftRecord.unit} (
                          {row.leftRecord.year})
                        </td>
                        <td>
                          {row.rightRecord.value.toLocaleString()} {row.rightRecord.unit} (
                          {row.rightRecord.year})
                        </td>
                        <td>
                          {row.directlyComparable && row.delta !== null
                            ? `${row.delta >= 0 ? "+" : ""}${row.delta.toLocaleString()} ${row.leftRecord.unit}`
                            : "Not directly comparable"}
                        </td>
                        <td>
                          {row.directlyComparable && row.deltaPercent !== null
                            ? `${row.deltaPercent >= 0 ? "+" : ""}${(row.deltaPercent * 100).toFixed(1)}%`
                            : "Not directly comparable"}
                        </td>
                        <td>
                          {row.leftRecord.year === row.rightRecord.year
                            ? `${row.leftRecord.year} (matched)`
                            : `${row.leftRecord.year} vs ${row.rightRecord.year}`}
                        </td>
                        <td>{row.sameSourceCitation ? "Same source" : "Different source"}</td>
                        <td>
                          {row.leftRecord.confidence}/{row.leftRecord.freshness} vs{" "}
                          {row.rightRecord.confidence}/{row.rightRecord.freshness}
                        </td>
                        <td>
                          <a href={row.leftRecord.sourceUrl} target="_blank" rel="noreferrer">
                            {row.leftRecord.sourceName}
                          </a>
                        </td>
                        <td>
                          <a href={row.rightRecord.sourceUrl} target="_blank" rel="noreferrer">
                            {row.rightRecord.sourceName}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sectionIntro">
                {sameCitationOnly
                  ? `No same-citation shared material records yet between ${leftCountry.name} and ${rightCountry.name}.`
                  : comparableOnly
                    ? `No directly comparable shared material records yet between ${leftCountry.name} and ${rightCountry.name}.`
                    : matchedYearOnly
                      ? `No matched-year shared material records yet between ${leftCountry.name} and ${rightCountry.name}.`
                      : `No shared material records yet between ${leftCountry.name} and ${rightCountry.name}.`}
              </p>
            )}
          </>
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
