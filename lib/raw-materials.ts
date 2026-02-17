export type RawMaterialItem = {
  name: string;
  category: "Metals" | "Energy" | "Industrial Minerals" | "Battery Materials";
  majorCountries: string[];
  notes: string;
};

export const rawMaterials: RawMaterialItem[] = [
  {
    name: "Iron ore",
    category: "Metals",
    majorCountries: ["Australia", "Brazil", "China", "India", "Russia"],
    notes: "Largest mine output and reserves are concentrated in Australia and Brazil.",
  },
  {
    name: "Gold",
    category: "Metals",
    majorCountries: ["China", "Australia", "Russia", "Canada", "South Africa"],
    notes: "Production is globally spread, with strong output across Asia, Oceania, and Africa.",
  },
  {
    name: "Copper",
    category: "Metals",
    majorCountries: ["Chile", "Peru", "DR Congo", "China", "United States"],
    notes: "Chile and Peru dominate mine supply; refining is heavily concentrated in China.",
  },
  {
    name: "Bauxite (Aluminum)",
    category: "Industrial Minerals",
    majorCountries: ["Australia", "Guinea", "China", "Brazil", "India"],
    notes: "Guinea and Australia are key ore suppliers; China is a major processor.",
  },
  {
    name: "Nickel",
    category: "Battery Materials",
    majorCountries: ["Indonesia", "Philippines", "Russia", "New Caledonia", "Australia"],
    notes: "Indonesia is the key source for battery-grade nickel growth.",
  },
  {
    name: "Lithium",
    category: "Battery Materials",
    majorCountries: ["Australia", "Chile", "China", "Argentina", "Brazil"],
    notes: "Australia leads hard-rock output; Chile/Argentina are central in brine production.",
  },
  {
    name: "Cobalt",
    category: "Battery Materials",
    majorCountries: ["DR Congo", "Indonesia", "Russia", "Australia", "Philippines"],
    notes: "DR Congo remains the dominant mine source globally.",
  },
  {
    name: "Rare earths",
    category: "Industrial Minerals",
    majorCountries: ["China", "United States", "Myanmar", "Australia", "Thailand"],
    notes: "China holds strong positions in both mining and especially processing.",
  },
  {
    name: "Uranium",
    category: "Energy",
    majorCountries: ["Kazakhstan", "Canada", "Namibia", "Australia", "Uzbekistan"],
    notes: "Kazakhstan is the largest producer by a wide margin.",
  },
  {
    name: "Crude oil",
    category: "Energy",
    majorCountries: ["United States", "Saudi Arabia", "Russia", "Canada", "Iraq"],
    notes: "Top output is concentrated in North America and the Middle East.",
  },
];

export const rawMaterialCategories = [
  "All",
  "Metals",
  "Energy",
  "Industrial Minerals",
  "Battery Materials",
] as const;
