export type EnergyFamilyId =
  | "solar-pv"
  | "solar-thermal"
  | "wind"
  | "flow-power"
  | "bioenergy"
  | "thermal-recovery"
  | "mechanical-human"
  | "gravity-storage"
  | "coordinated-hybrid";

export interface EnergyFamily {
  id: EnergyFamilyId;
  name: string;
  shortName: string;
  source: string;
  purpose: string;
  pathway: string;
  glyph: string;
  demonstration: "live" | "catalogued";
}

/**
 * Product-lineage catalog recovered from the pre-Build Week EnergyCircle
 * archive. This is a new representation written for the governed Build Week
 * application; no implementation code from the archive is used here.
 */
export const ENERGY_FAMILIES: readonly EnergyFamily[] = [
  {
    id: "solar-pv",
    name: "Solar photovoltaic",
    shortName: "Solar PV",
    source: "Sunlight",
    purpose: "Electric generation",
    pathway: "Sun → DC generation → electrical storage → loads",
    glyph: "SUN",
    demonstration: "live",
  },
  {
    id: "solar-thermal",
    name: "Solar thermal",
    shortName: "Solar heat",
    source: "Sunlight",
    purpose: "Direct heat",
    pathway: "Sun → heat collector → thermal storage → heat loads",
    glyph: "HEAT",
    demonstration: "catalogued",
  },
  {
    id: "wind",
    name: "Wind energy",
    shortName: "Wind",
    source: "Moving air",
    purpose: "Generation or water lifting",
    pathway: "Wind → rotation → generator or lift → useful work",
    glyph: "WIND",
    demonstration: "catalogued",
  },
  {
    id: "flow-power",
    name: "FlowPower",
    shortName: "Water & pressure",
    source: "Flowing water or pressure",
    purpose: "Continuous generation or recovery",
    pathway: "Flow or pressure → turbine → generation → loads",
    glyph: "FLOW",
    demonstration: "catalogued",
  },
  {
    id: "bioenergy",
    name: "Bioenergy",
    shortName: "Biomass & biogas",
    source: "Organic material",
    purpose: "Heat, gas, or generation",
    pathway: "Feedstock → conversion → gas or heat → loads",
    glyph: "BIO",
    demonstration: "catalogued",
  },
  {
    id: "thermal-recovery",
    name: "Thermal recovery",
    shortName: "Recovered heat",
    source: "Waste heat",
    purpose: "Load reduction and heat reuse",
    pathway: "Waste heat → exchanger → thermal buffer → heat loads",
    glyph: "LOOP",
    demonstration: "catalogued",
  },
  {
    id: "mechanical-human",
    name: "Mechanical & human power",
    shortName: "Mechanical",
    source: "Human or machine motion",
    purpose: "Emergency generation or direct work",
    pathway: "Motion → mechanical coupling → generator or load",
    glyph: "MOVE",
    demonstration: "catalogued",
  },
  {
    id: "gravity-storage",
    name: "Gravity storage",
    shortName: "Gravity storage",
    source: "Elevation and stored mass",
    purpose: "Mechanical energy storage",
    pathway: "Surplus power → water lift → stored head → generation",
    glyph: "HEAD",
    demonstration: "live",
  },
  {
    id: "coordinated-hybrid",
    name: "Coordinated hybrid",
    shortName: "Hybrid",
    source: "Multiple property resources",
    purpose: "Resilient combined supply",
    pathway: "Sources → governed conversion and storage → priority loads",
    glyph: "MIX",
    demonstration: "catalogued",
  },
] as const;

export const DEFAULT_FAMILY = ENERGY_FAMILIES.find(
  (family) => family.id === "gravity-storage",
)!;
