export type MaterialCategory = "Metals" | "Energy" | "Industrial Minerals" | "Battery Materials";

export type DataPoint = {
  country: string;
  value: number;
  unit: string;
  year: number;
  metric: "mine-production" | "reserves";
  sourceName: string;
  sourceUrl: string;
};

export type RawMaterialItem = {
  name: string;
  slug: string;
  category: MaterialCategory;
  notes: string;
  updatedAt: string;
  dataPoints: DataPoint[];
};

export const rawMaterials: RawMaterialItem[] = [
  {
    name: "Iron ore",
    slug: "iron-ore",
    category: "Metals",
    notes: "Mine production values in million metric tons of usable ore content.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "Australia",
        value: 960,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Iron Ore Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/iron-ore-statistics-and-information",
      },
      {
        country: "Brazil",
        value: 440,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Iron Ore Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/iron-ore-statistics-and-information",
      },
      {
        country: "China",
        value: 280,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Iron Ore Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/iron-ore-statistics-and-information",
      },
    ],
  },
  {
    name: "Gold",
    slug: "gold",
    category: "Metals",
    notes: "Mine production values in metric tons.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "China",
        value: 370,
        unit: "t",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Gold Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/gold-statistics-and-information",
      },
      {
        country: "Australia",
        value: 290,
        unit: "t",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Gold Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/gold-statistics-and-information",
      },
      {
        country: "Russia",
        value: 310,
        unit: "t",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Gold Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/gold-statistics-and-information",
      },
    ],
  },
  {
    name: "Copper",
    slug: "copper",
    category: "Metals",
    notes: "Mine production values in million metric tons.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "Chile",
        value: 5.3,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Copper Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information",
      },
      {
        country: "Peru",
        value: 2.6,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Copper Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information",
      },
      {
        country: "DR Congo",
        value: 3.3,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Copper Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information",
      },
    ],
  },
  {
    name: "Lithium",
    slug: "lithium",
    category: "Battery Materials",
    notes: "Mine production values in metric tons Li content.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "Australia",
        value: 88000,
        unit: "t Li",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Lithium Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/lithium-statistics-and-information",
      },
      {
        country: "Chile",
        value: 49000,
        unit: "t Li",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Lithium Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/lithium-statistics-and-information",
      },
      {
        country: "China",
        value: 41000,
        unit: "t Li",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Lithium Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/lithium-statistics-and-information",
      },
    ],
  },
  {
    name: "Cobalt",
    slug: "cobalt",
    category: "Battery Materials",
    notes: "Mine production values in metric tons Co content.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "DR Congo",
        value: 220000,
        unit: "t Co",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Cobalt Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/cobalt-statistics-and-information",
      },
      {
        country: "Indonesia",
        value: 28000,
        unit: "t Co",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Cobalt Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/cobalt-statistics-and-information",
      },
      {
        country: "Russia",
        value: 8500,
        unit: "t Co",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Cobalt Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/cobalt-statistics-and-information",
      },
    ],
  },
  {
    name: "Nickel",
    slug: "nickel",
    category: "Battery Materials",
    notes: "Mine production values in million metric tons.",
    updatedAt: "2026-02-17",
    dataPoints: [
      {
        country: "Indonesia",
        value: 2.2,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Nickel Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/nickel-statistics-and-information",
      },
      {
        country: "Philippines",
        value: 0.4,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Nickel Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/nickel-statistics-and-information",
      },
      {
        country: "New Caledonia",
        value: 0.23,
        unit: "Mt",
        year: 2024,
        metric: "mine-production",
        sourceName: "USGS Nickel Statistics and Information",
        sourceUrl:
          "https://www.usgs.gov/centers/national-minerals-information-center/nickel-statistics-and-information",
      },
    ],
  },
];

export const rawMaterialCategories = [
  "All",
  "Metals",
  "Energy",
  "Industrial Minerals",
  "Battery Materials",
] as const;

export function getMaterialBySlug(slug: string) {
  return rawMaterials.find((item) => item.slug === slug) ?? null;
}
