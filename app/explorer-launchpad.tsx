"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionHeader } from "./components";
import { getCountryProfiles } from "../lib/countries";
import { rawMaterials } from "../lib/raw-materials";

const countries = getCountryProfiles();

export default function ExplorerLaunchpad() {
  const defaultLeftCountry = countries[0]?.slug ?? "";
  const defaultRightCountry = countries[1]?.slug ?? countries[0]?.slug ?? "";
  const defaultLeftMaterial = rawMaterials[0]?.slug ?? "";
  const defaultRightMaterial = rawMaterials[1]?.slug ?? rawMaterials[0]?.slug ?? "";

  const [leftCountry, setLeftCountry] = useState(defaultLeftCountry);
  const [rightCountry, setRightCountry] = useState(defaultRightCountry);
  const [leftMaterial, setLeftMaterial] = useState(defaultLeftMaterial);
  const [rightMaterial, setRightMaterial] = useState(defaultRightMaterial);

  const compareHref = useMemo(() => {
    const params = new URLSearchParams({
      leftCountry,
      rightCountry,
      leftMaterial,
      rightMaterial,
    });

    return `/compare?${params.toString()}`;
  }, [leftCountry, rightCountry, leftMaterial, rightMaterial]);

  return (
    <Card>
      <SectionHeader
        eyebrow="Explorer command center"
        title="Launch compare view with preselected countries and materials"
        description="Use this launchpad for direct side-by-side analysis, then continue in the full compare workspace."
      />

      <div className="gridTwo">
        <label>
          Left country
          <select value={leftCountry} onChange={(event) => setLeftCountry(event.target.value)}>
            {countries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Right country
          <select value={rightCountry} onChange={(event) => setRightCountry(event.target.value)}>
            {countries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Left material
          <select value={leftMaterial} onChange={(event) => setLeftMaterial(event.target.value)}>
            {rawMaterials.map((material) => (
              <option key={material.slug} value={material.slug}>
                {material.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Right material
          <select value={rightMaterial} onChange={(event) => setRightMaterial(event.target.value)}>
            {rawMaterials.map((material) => (
              <option key={material.slug} value={material.slug}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filterActions">
        <Link href={compareHref} className="secondaryButton">
          Open compare with these selections
        </Link>
      </div>
    </Card>
  );
}
