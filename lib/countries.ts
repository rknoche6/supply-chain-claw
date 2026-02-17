import { tradeFlows } from "./trade-data";

export type CountryRoleBreakdown = {
  importerCount: number;
  exporterCount: number;
  totalFlows: number;
};

export type CountryPartner = {
  name: string;
  sharedFlows: number;
  role: "import-partner" | "export-partner";
};

export type CountryProductRecord = {
  product: string;
  category: string;
  role: "Importer" | "Exporter";
  route: string;
};

export type CountryProfile = {
  slug: string;
  name: string;
  roleBreakdown: CountryRoleBreakdown;
  topPartners: CountryPartner[];
  products: CountryProductRecord[];
};

export function toCountrySlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const countryProfiles: CountryProfile[] = buildCountryProfiles();

function buildCountryProfiles() {
  const allCountries = new Set<string>();

  for (const flow of tradeFlows) {
    flow.topImporters.forEach((country) => allCountries.add(country));
    flow.topExporters.forEach((country) => allCountries.add(country));
  }

  return Array.from(allCountries)
    .sort((a, b) => a.localeCompare(b))
    .map((countryName) => {
      const importerFlows = tradeFlows.filter((flow) => flow.topImporters.includes(countryName));
      const exporterFlows = tradeFlows.filter((flow) => flow.topExporters.includes(countryName));

      const importPartners = new Map<string, number>();
      importerFlows.forEach((flow) => {
        flow.topExporters.forEach((partner) => {
          importPartners.set(partner, (importPartners.get(partner) ?? 0) + 1);
        });
      });

      const exportPartners = new Map<string, number>();
      exporterFlows.forEach((flow) => {
        flow.topImporters.forEach((partner) => {
          exportPartners.set(partner, (exportPartners.get(partner) ?? 0) + 1);
        });
      });

      const topPartners = [
        ...Array.from(importPartners.entries()).map(([name, sharedFlows]) => ({
          name,
          sharedFlows,
          role: "import-partner" as const,
        })),
        ...Array.from(exportPartners.entries()).map(([name, sharedFlows]) => ({
          name,
          sharedFlows,
          role: "export-partner" as const,
        })),
      ]
        .sort((a, b) => b.sharedFlows - a.sharedFlows || a.name.localeCompare(b.name))
        .slice(0, 8);

      const products: CountryProductRecord[] = [
        ...importerFlows.map((flow) => ({
          product: flow.product,
          category: flow.category,
          role: "Importer" as const,
          route: flow.keyRoute,
        })),
        ...exporterFlows.map((flow) => ({
          product: flow.product,
          category: flow.category,
          role: "Exporter" as const,
          route: flow.keyRoute,
        })),
      ].sort((a, b) => a.product.localeCompare(b.product));

      return {
        slug: toCountrySlug(countryName),
        name: countryName,
        roleBreakdown: {
          importerCount: importerFlows.length,
          exporterCount: exporterFlows.length,
          totalFlows: new Set([...importerFlows, ...exporterFlows].map((item) => item.product))
            .size,
        },
        topPartners,
        products,
      };
    });
}

export function getCountryProfiles() {
  return countryProfiles;
}

export function getCountryBySlug(slug: string) {
  return countryProfiles.find((item) => item.slug === slug);
}
