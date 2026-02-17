export type TradeFlow = {
  product: string;
  category: "Semiconductors" | "Raw Materials" | "Agriculture" | "Energy";
  topImporters: string[];
  topExporters: string[];
  keyRoute: string;
};

export const tradeFlows: TradeFlow[] = [
  {
    product: "Advanced GPUs",
    category: "Semiconductors",
    topImporters: ["United States", "Germany", "South Korea"],
    topExporters: ["Taiwan", "South Korea", "China"],
    keyRoute: "Taipei → Los Angeles → Chicago",
  },
  {
    product: "Server CPUs",
    category: "Semiconductors",
    topImporters: ["United States", "Netherlands", "Japan"],
    topExporters: ["Taiwan", "Malaysia", "Vietnam"],
    keyRoute: "Hsinchu → Singapore → Rotterdam",
  },
  {
    product: "Refined Copper",
    category: "Raw Materials",
    topImporters: ["China", "Germany", "United States"],
    topExporters: ["Chile", "Peru", "DR Congo"],
    keyRoute: "Callao → Shanghai",
  },
  {
    product: "Battery-grade Lithium",
    category: "Raw Materials",
    topImporters: ["China", "South Korea", "Japan"],
    topExporters: ["Australia", "Chile", "Argentina"],
    keyRoute: "Perth → Ningbo",
  },
  {
    product: "Bananas",
    category: "Agriculture",
    topImporters: ["United States", "Germany", "United Kingdom"],
    topExporters: ["Ecuador", "Philippines", "Costa Rica"],
    keyRoute: "Guayaquil → Los Angeles",
  },
  {
    product: "Wheat",
    category: "Agriculture",
    topImporters: ["Egypt", "Indonesia", "Türkiye"],
    topExporters: ["Russia", "United States", "Canada"],
    keyRoute: "Novorossiysk → Alexandria",
  },
  {
    product: "LNG",
    category: "Energy",
    topImporters: ["Japan", "China", "South Korea"],
    topExporters: ["Qatar", "United States", "Australia"],
    keyRoute: "Qatar → Yokohama",
  },
];

export const categories = [
  "All",
  "Semiconductors",
  "Raw Materials",
  "Agriculture",
  "Energy",
] as const;
