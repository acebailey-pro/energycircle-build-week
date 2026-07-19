import type { EnergyFamilyId } from "./architecture-catalog";

export type TruthState =
  | "measured"
  | "assumed"
  | "calculated"
  | "estimated"
  | "unknown";

export type Feasibility = "VIABLE" | "FRAGILE" | "INFEASIBLE";
export type LiveFamilyId = EnergyFamilyId;
export type ComponentId = string;
export type RouteKind = "power" | "water" | "heat" | "gas" | "mechanical";
export type ComponentVariantId = "reclaimed" | "standard" | "high-duty";
export type PropertyObjective = "reduce-cost" | "backup" | "water-service" | "use-waste" | "independence";
export type BudgetBand = "existing" | "starter" | "staged" | "complete";
export type PropertyResourceId = "solar" | "wind" | "waterFlow" | "waterStorage" | "elevation" | "biomass" | "wasteHeat" | "humanMotion";
export type ResourceLevel = 0 | 1 | 2;

export interface PropertyProfile {
  objective: PropertyObjective;
  budgetBand: BudgetBand;
  resources: Record<PropertyResourceId, ResourceLevel>;
}

export interface Point { x: number; y: number }

export interface EnergyComponent {
  id: ComponentId;
  label: string;
  mark: string;
  kind: "source" | "storage" | "conversion" | "load";
  position: Point;
  variantId: ComponentVariantId;
}

export interface ComponentVariant {
  id: ComponentVariantId;
  label: string;
  performanceFactor: number;
  storageFactor: number;
  costFactor: number;
  serviceLife: string;
  evidence: string;
  boundary: string;
}

export const COMPONENT_VARIANTS: readonly ComponentVariant[] = [
  { id: "reclaimed", label: "Verified reclaimed", performanceFactor: 0.82, storageFactor: 0.78, costFactor: 0.58, serviceLife: "Unknown until inspected", evidence: "Estimated derating until make, model, condition, and test data are recorded.", boundary: "Use only equipment with legible ratings, compatible specifications, safe condition, and required inspection." },
  { id: "standard", label: "Standard new", performanceFactor: 1, storageFactor: 1, costFactor: 1, serviceLife: "Manufacturer-defined", evidence: "Reference performance and planning cost basis used by the active family model.", boundary: "Select an actual rated product before procurement or construction." },
  { id: "high-duty", label: "High-duty / serviceable", performanceFactor: 1.08, storageFactor: 1.1, costFactor: 1.35, serviceLife: "Extended-duty target", evidence: "Estimated improvement pending selected-equipment curves, ratings, warranty, and service data.", boundary: "Higher rating does not remove compatibility, protection, site, or permit requirements." },
] as const;

export interface ProjectParameters {
  [key: string]: number | undefined;
  criticalLoadKw: number;
  autonomyHours: number;
}

export interface ProjectModel {
  id: string;
  name: string;
  familyId: LiveFamilyId;
  revision: number;
  components: Record<ComponentId, EnergyComponent>;
  parameters: ProjectParameters;
  property: PropertyProfile;
  failures: {
    intakeBlocked: boolean;
    inverterOffline: boolean;
    activeFailure: boolean;
  };
}

export interface TruthValue {
  value: number | null;
  unit: string;
  truth: TruthState;
  label: string;
}

export interface EngineWarning {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface CostEstimate {
  accessible: { low: number; high: number };
  installed: { low: number; high: number };
  currency: "USD";
  truth: "estimated";
  basis: string;
  sourceLabel: string;
  sourceUrl: string | null;
  sourceYear: string;
}

export interface EngineResult {
  projectRevision: number;
  familyId: LiveFamilyId;
  feasibility: Feasibility;
  resourceMetric: TruthValue;
  lossMetric: TruthValue;
  storageMetric: TruthValue;
  productionMetric: TruthValue;
  runtimeMetric: TruthValue;
  targetMetric: TruthValue;
  headlineMetrics: TruthValue[];
  warnings: EngineWarning[];
  assumptions: Array<{ label: string; value: string; truth: TruthState }>;
  unknowns: Array<{ label: string; truth: "unknown" }>;
  cost: CostEstimate;
  limitingFactor: string;
  nextMeasurement: string;
}

export interface FamilyControl {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface FamilyScenario {
  number: string;
  title: string;
  description: string;
  initialComponent: ComponentId;
  initialInsight: string;
  startPrompt: string;
  controls: FamilyControl[];
  routes: Array<{ from: ComponentId; to: ComponentId; kind: RouteKind }>;
  flowKinds: Array<{ kind: RouteKind; label: string }>;
  failureLabel: string;
  failureDetail: string;
  sceneLabelA: string;
  sceneLabelB: string;
  questions: string[];
}

export type DomainMutation =
  | { type: "move-component"; id: ComponentId; position: Point }
  | { type: "set-parameter"; key: string; value: number }
  | { type: "set-active-failure"; active: boolean }
  | { type: "set-pipe-diameter"; valueM: number }
  | { type: "set-reservoir-volume"; valueM3: number }
  | { type: "set-solar-array-capacity"; valueKw: number }
  | { type: "set-battery-capacity"; valueKwh: number }
  | { type: "set-critical-load"; valueKw: number }
  | { type: "set-autonomy-hours"; valueHours: number }
  | { type: "set-intake-blocked"; blocked: boolean }
  | { type: "set-inverter-offline"; offline: boolean }
  | { type: "select-component-variant"; id: ComponentId; variantId: ComponentVariantId }
  | { type: "set-inaction-annual-cost"; value: number }
  | { type: "set-inaction-disruption-cost"; value: number }
  | { type: "set-inaction-years"; value: number }
  | { type: "set-property-objective"; objective: PropertyObjective }
  | { type: "set-property-budget"; budgetBand: BudgetBand }
  | { type: "set-property-resource"; resource: PropertyResourceId; level: ResourceLevel };

export interface PreviewTransaction {
  base: ProjectModel;
  draft: ProjectModel;
  mutation: DomainMutation;
}

const c = (
  id: string,
  label: string,
  mark: string,
  kind: EnergyComponent["kind"],
  x: number,
  y: number,
): EnergyComponent => ({ id, label, mark, kind, position: { x, y }, variantId: "standard" });

const f = (overrides: Partial<ProjectModel["failures"]> = {}) => ({
  intakeBlocked: false,
  inverterOffline: false,
  activeFailure: false,
  ...overrides,
});

const INACTION_DEFAULTS: Record<EnergyFamilyId, { annual: number; disruption: number }> = {
  "solar-pv": { annual: 1800, disruption: 450 },
  "solar-thermal": { annual: 900, disruption: 150 },
  wind: { annual: 1500, disruption: 500 },
  "flow-power": { annual: 1200, disruption: 400 },
  bioenergy: { annual: 2400, disruption: 900 },
  "thermal-recovery": { annual: 1100, disruption: 250 },
  "mechanical-human": { annual: 300, disruption: 180 },
  "gravity-storage": { annual: 1900, disruption: 700 },
  "coordinated-hybrid": { annual: 2800, disruption: 1200 },
};

export const DEFAULT_PROPERTY_PROFILE: PropertyProfile = {
  objective: "independence",
  budgetBand: "staged",
  resources: { solar: 2, wind: 1, waterFlow: 0, waterStorage: 2, elevation: 2, biomass: 1, wasteHeat: 0, humanMotion: 2 },
};

const project = (
  familyId: EnergyFamilyId,
  name: string,
  components: EnergyComponent[],
  parameters: ProjectParameters,
): ProjectModel => ({
  id: `reference-${familyId}`,
  name,
  familyId,
  revision: 1,
  components: Object.fromEntries(components.map((item) => [item.id, item])),
  parameters: {
    annualBaselineCost: INACTION_DEFAULTS[familyId].annual,
    annualDisruptionCost: INACTION_DEFAULTS[familyId].disruption,
    inactionYears: 5,
    annualEscalationPercent: 3,
    ...parameters,
  },
  property: { ...DEFAULT_PROPERTY_PROFILE, resources: { ...DEFAULT_PROPERTY_PROFILE.resources } },
  failures: f(),
});

export const FAMILY_SCENARIOS: Record<EnergyFamilyId, FamilyScenario> = {
  "solar-pv": {
    number: "01",
    title: "Solar + Battery Property",
    description: "Place generation, conversion, storage, and loads on the property. Sun access, harvest, autonomy, cost, warnings, and every representation remain connected.",
    initialComponent: "solar",
    initialInsight: "Modeled tree and terrain obstruction reduce the array's solar access. Move the array into clearer exposure.",
    startPrompt: "Drag the array into sun",
    controls: [
      { key: "solarArrayKw", label: "Solar array", unit: "kW", min: 0.4, max: 20, step: 0.1 },
      { key: "batteryCapacityKwh", label: "Battery capacity", unit: "kWh", min: 1, max: 60, step: 0.5 },
      { key: "criticalLoadKw", label: "Critical load", unit: "kW", min: 0.1, max: 5, step: 0.1 },
    ],
    routes: [
      { from: "solar", to: "inverter", kind: "power" },
      { from: "inverter", to: "battery", kind: "power" },
      { from: "battery", to: "home", kind: "power" },
    ],
    flowKinds: [{ kind: "power", label: "Electrical path" }],
    failureLabel: "Inverter outage",
    failureDetail: "Interrupts conversion between DC generation, storage, and AC loads.",
    sceneLabelA: "Clear solar exposure",
    sceneLabelB: "Tree obstruction",
    questions: ["Could this work on my property?", "What is limiting it?", "What might it cost?", "What should I measure next?"],
  },
  "solar-thermal": {
    number: "02",
    title: "Solar Heat + Thermal Storage",
    description: "Collect sunlight as useful heat, buffer it in water, and deliver it to domestic hot-water or space-heating loads.",
    initialComponent: "collector",
    initialInsight: "Collector placement controls modeled solar access before heat reaches the storage tank.",
    startPrompt: "Move the collector into sun",
    controls: [
      { key: "collectorAreaM2", label: "Collector area", unit: "m²", min: 2, max: 30, step: 0.5 },
      { key: "tankVolumeL", label: "Hot-water storage", unit: "L", min: 100, max: 1500, step: 25 },
      { key: "criticalLoadKw", label: "Heat load", unit: "kW", min: 0.1, max: 3, step: 0.1 },
    ],
    routes: [
      { from: "collector", to: "heatExchanger", kind: "heat" },
      { from: "heatExchanger", to: "hotWaterTank", kind: "heat" },
      { from: "hotWaterTank", to: "heatLoad", kind: "heat" },
    ],
    flowKinds: [{ kind: "heat", label: "Thermal path" }],
    failureLabel: "Circulation stopped",
    failureDetail: "Stops useful heat transfer from the collector to thermal storage.",
    sceneLabelA: "Clear solar exposure",
    sceneLabelB: "Roof and tree shade",
    questions: ["Can solar heat serve my loads?", "How much hot water can it buffer?", "What might it cost?", "What site measurement matters next?"],
  },
  wind: {
    number: "03",
    title: "Wind Generation + Water Lifting",
    description: "Use moving air for electricity or direct mechanical water lifting while exposing tower clearance, storage, and intermittency.",
    initialComponent: "windTurbine",
    initialInsight: "The reference turbine begins close to modeled terrain turbulence. Move it toward the open ridge to change effective wind.",
    startPrompt: "Move the turbine to clear air",
    controls: [
      { key: "rotorDiameterM", label: "Rotor diameter", unit: "m", min: 1, max: 15, step: 0.5 },
      { key: "windSpeedMs", label: "Average wind", unit: "m/s", min: 2, max: 12, step: 0.1 },
      { key: "batteryCapacityKwh", label: "Storage", unit: "kWh", min: 1, max: 80, step: 1 },
    ],
    routes: [
      { from: "windTurbine", to: "windController", kind: "power" },
      { from: "windController", to: "battery", kind: "power" },
      { from: "battery", to: "home", kind: "power" },
      { from: "windTurbine", to: "waterPump", kind: "mechanical" },
      { from: "waterPump", to: "liftTank", kind: "water" },
    ],
    flowKinds: [{ kind: "power", label: "Electrical path" }, { kind: "water", label: "Water-lift path" }],
    failureLabel: "Rotor brake engaged",
    failureDetail: "Stops both electrical generation and direct mechanical water lifting.",
    sceneLabelA: "Open ridge wind",
    sceneLabelB: "Turbulent obstruction zone",
    questions: ["Is there enough wind here?", "Could it lift water instead of using a pump?", "What might it cost?", "What measurement is still unknown?"],
  },
  "flow-power": {
    number: "04",
    title: "Water Flow + Pressure Recovery",
    description: "Evaluate natural flow, irrigation pressure, or existing water infrastructure as a continuous energy path.",
    initialComponent: "waterIntake",
    initialInsight: "Available flow is not enough by itself; vertical head and route loss determine useful turbine output.",
    startPrompt: "Move the intake uphill",
    controls: [
      { key: "flowLps", label: "Available flow", unit: "L/s", min: 0.2, max: 30, step: 0.1 },
      { key: "pipeDiameterM", label: "Pipe diameter", unit: "m", min: 0.032, max: 0.2, step: 0.002 },
      { key: "batteryCapacityKwh", label: "Electrical storage", unit: "kWh", min: 0, max: 40, step: 1 },
    ],
    routes: [
      { from: "waterIntake", to: "flowTurbine", kind: "water" },
      { from: "flowTurbine", to: "flowController", kind: "power" },
      { from: "flowController", to: "battery", kind: "power" },
      { from: "battery", to: "home", kind: "power" },
    ],
    flowKinds: [{ kind: "water", label: "Water path" }, { kind: "power", label: "Electrical path" }],
    failureLabel: "Intake unavailable",
    failureDetail: "Removes the water or pressure source and propagates zero generation.",
    sceneLabelA: "Higher intake head",
    sceneLabelB: "Lower return elevation",
    questions: ["Do I need naturally flowing water?", "Can irrigation pressure be recovered?", "What might it cost?", "Which field measurements are required?"],
  },
  bioenergy: {
    number: "05",
    title: "Biomass + Biogas Conversion",
    description: "Trace organic feedstock through conversion, gas storage, useful heat, and optional electricity without hiding operating requirements.",
    initialComponent: "feedstock",
    initialInsight: "Feedstock quantity, consistency, and transport distance govern whether the conversion path can sustain its load.",
    startPrompt: "Move feedstock near conversion",
    controls: [
      { key: "feedstockKgDay", label: "Feedstock", unit: "kg/day", min: 10, max: 2000, step: 10 },
      { key: "gasStorageM3", label: "Gas storage", unit: "m³", min: 1, max: 120, step: 1 },
      { key: "criticalLoadKw", label: "Useful load", unit: "kW", min: 0.1, max: 10, step: 0.1 },
    ],
    routes: [
      { from: "feedstock", to: "digester", kind: "mechanical" },
      { from: "digester", to: "gasStorage", kind: "gas" },
      { from: "gasStorage", to: "generator", kind: "gas" },
      { from: "generator", to: "home", kind: "power" },
      { from: "generator", to: "heatLoad", kind: "heat" },
    ],
    flowKinds: [{ kind: "gas", label: "Biogas path" }, { kind: "heat", label: "Useful heat" }, { kind: "power", label: "Electrical path" }],
    failureLabel: "Conversion offline",
    failureDetail: "Stops gas production while stored gas remains a finite reserve.",
    sceneLabelA: "Dry service access",
    sceneLabelB: "Long feedstock route",
    questions: ["What organic material is required?", "Can this serve heat or electricity?", "What might it cost?", "What operating work is required?"],
  },
  "thermal-recovery": {
    number: "06",
    title: "Recovered Heat Loop",
    description: "Capture heat already leaving a building or process, buffer it, and offset a defined thermal load.",
    initialComponent: "heatExchanger",
    initialInsight: "The useful result depends on both recoverable heat and how far it must travel before reaching the load.",
    startPrompt: "Shorten the recovery route",
    controls: [
      { key: "wasteHeatKw", label: "Available waste heat", unit: "kW", min: 0.2, max: 30, step: 0.1 },
      { key: "recoveryHours", label: "Availability", unit: "h/day", min: 1, max: 24, step: 1 },
      { key: "bufferKwh", label: "Thermal buffer", unit: "kWh", min: 0, max: 100, step: 1 },
    ],
    routes: [
      { from: "wasteHeat", to: "heatExchanger", kind: "heat" },
      { from: "heatExchanger", to: "thermalBuffer", kind: "heat" },
      { from: "thermalBuffer", to: "heatLoad", kind: "heat" },
    ],
    flowKinds: [{ kind: "heat", label: "Recovered heat path" }],
    failureLabel: "Recovery loop bypassed",
    failureDetail: "Returns the modeled recovered contribution to zero without changing the underlying load.",
    sceneLabelA: "Short insulated route",
    sceneLabelB: "Long exposed route",
    questions: ["Where is heat already being wasted?", "How much load can it offset?", "What might it cost?", "What temperatures must be measured?"],
  },
  "mechanical-human": {
    number: "07",
    title: "Mechanical + Human Power",
    description: "Use direct motion for essential work, water pumping, or emergency charging while keeping human limits explicit.",
    initialComponent: "pedalDrive",
    initialInsight: "Direct mechanical work avoids conversion losses; electrical storage adds flexibility but consumes part of the input.",
    startPrompt: "Align the drive with its load",
    controls: [
      { key: "inputPowerW", label: "Sustained input", unit: "W", min: 40, max: 500, step: 10 },
      { key: "operationHours", label: "Operation", unit: "h/day", min: 0.25, max: 8, step: 0.25 },
      { key: "batteryCapacityKwh", label: "Emergency storage", unit: "kWh", min: 0.2, max: 10, step: 0.1 },
    ],
    routes: [
      { from: "pedalDrive", to: "transmission", kind: "mechanical" },
      { from: "transmission", to: "directPump", kind: "mechanical" },
      { from: "transmission", to: "generator", kind: "mechanical" },
      { from: "generator", to: "battery", kind: "power" },
      { from: "battery", to: "essentialLoad", kind: "power" },
    ],
    flowKinds: [{ kind: "mechanical", label: "Direct work" }, { kind: "power", label: "Charging path" }],
    failureLabel: "Drive disconnected",
    failureDetail: "Interrupts both direct mechanical work and emergency charging.",
    sceneLabelA: "Direct coupled work",
    sceneLabelB: "Conversion and storage path",
    questions: ["Which loads are realistic for human power?", "Is direct work better than charging?", "What might it cost?", "How long must someone operate it?"],
  },
  "gravity-storage": {
    number: "08",
    title: "Hillside Water Storage",
    description: "Store surplus energy by lifting common property water, then recover part of it through controlled descent.",
    initialComponent: "upperReservoir",
    initialInsight: "The pipe consumes part of the available head. Move the upper reservoir to reveal how geometry changes the complete storage loop.",
    startPrompt: "Drag the tank uphill",
    controls: [
      { key: "pipeDiameterM", label: "Pipe diameter", unit: "m", min: 0.032, max: 0.11, step: 0.002 },
      { key: "reservoirVolumeM3", label: "Upper storage", unit: "m³", min: 20, max: 500, step: 5 },
      { key: "criticalLoadKw", label: "Critical load", unit: "kW", min: 0.1, max: 5, step: 0.1 },
    ],
    routes: [
      { from: "lowerReservoir", to: "pump", kind: "water" },
      { from: "pump", to: "upperReservoir", kind: "water" },
      { from: "upperReservoir", to: "turbine", kind: "water" },
      { from: "turbine", to: "lowerReservoir", kind: "water" },
      { from: "solar", to: "pump", kind: "power" },
      { from: "turbine", to: "inverter", kind: "power" },
      { from: "inverter", to: "home", kind: "power" },
    ],
    flowKinds: [{ kind: "water", label: "Water path" }, { kind: "power", label: "Electrical path" }],
    failureLabel: "Intake obstruction",
    failureDetail: "Interrupts the water path and propagates zero turbine generation.",
    sceneLabelA: "Higher storage elevation",
    sceneLabelB: "Lower return elevation",
    questions: ["Can this work without a stream?", "How much elevation and water matter?", "What might it cost?", "What must be measured on site?"],
  },
  "coordinated-hybrid": {
    number: "09",
    title: "Coordinated Property Hybrid",
    description: "Compile multiple sources, recharge paths, storage methods, and priority loads into one governed property system.",
    initialComponent: "hybridController",
    initialInsight: "The controller does not create energy; it exposes how solar, wind, water, storage, and priority loads complement or constrain one another.",
    startPrompt: "Move the controller toward the loads",
    controls: [
      { key: "hybridSolarKw", label: "Solar contribution", unit: "kW", min: 0, max: 20, step: 0.5 },
      { key: "hybridWindKw", label: "Wind contribution", unit: "kW", min: 0, max: 20, step: 0.5 },
      { key: "hybridFlowKw", label: "Continuous flow", unit: "kW", min: 0, max: 5, step: 0.1 },
      { key: "batteryCapacityKwh", label: "Shared storage", unit: "kWh", min: 1, max: 120, step: 1 },
    ],
    routes: [
      { from: "solar", to: "hybridController", kind: "power" },
      { from: "windTurbine", to: "hybridController", kind: "power" },
      { from: "flowTurbine", to: "hybridController", kind: "power" },
      { from: "hybridController", to: "battery", kind: "power" },
      { from: "battery", to: "home", kind: "power" },
      { from: "hybridController", to: "waterPump", kind: "power" },
      { from: "waterPump", to: "liftTank", kind: "water" },
    ],
    flowKinds: [{ kind: "power", label: "Shared electrical bus" }, { kind: "water", label: "Recharge and water service" }],
    failureLabel: "Shared controller offline",
    failureDetail: "Disconnects coordinated delivery while source potential remains visible but unusable to priority loads.",
    sceneLabelA: "Diverse property resources",
    sceneLabelB: "Priority loads",
    questions: ["Which resources complement each other?", "What happens when one source stops?", "What might the combined system cost?", "Which load should receive priority?"],
  },
};

export const referenceProject = project("gravity-storage", "Hillside Water Storage", [
  c("solar", "Solar recharge array", "SUN", "source", 17, 67),
  c("pump", "Transfer pump", "P", "conversion", 34, 63),
  c("upperReservoir", "Upper reservoir", "H₂O", "storage", 27, 30),
  c("turbine", "Micro turbine", "T", "conversion", 55, 61),
  c("inverter", "Inverter", "INV", "conversion", 69, 47),
  c("home", "Critical loads", "LOAD", "load", 84, 37),
  c("lowerReservoir", "Lower reservoir", "H₂O", "storage", 79, 74),
], {
  reservoirVolumeM3: 135, pipeDiameterM: 0.05, designFlowM3s: 0.004,
  turbineEfficiency: 0.8, generatorEfficiency: 0.9, frictionFactor: 0.024,
  minorLossCoefficient: 3.2, criticalLoadKw: 0.6, autonomyHours: 12,
});

export const solarReferenceProject = project("solar-pv", "Solar + Battery Property", [
  c("solar", "Roof or ground array", "SUN", "source", 17, 67),
  c("inverter", "Hybrid inverter", "INV", "conversion", 49, 55),
  c("battery", "Battery storage", "BAT", "storage", 67, 58),
  c("home", "Critical home loads", "LOAD", "load", 84, 37),
], {
  solarArrayKw: 2.6, peakSunHours: 4.6, solarDerate: 0.77,
  batteryCapacityKwh: 10, batteryUsableFraction: 0.85, inverterEfficiency: 0.92,
  criticalLoadKw: 0.6, autonomyHours: 12,
});

const references: Record<EnergyFamilyId, ProjectModel> = {
  "solar-pv": solarReferenceProject,
  "solar-thermal": project("solar-thermal", "Solar Heat + Thermal Storage", [
    c("collector", "Solar thermal collector", "HEAT", "source", 18, 67),
    c("heatExchanger", "Heat exchanger", "HX", "conversion", 43, 56),
    c("hotWaterTank", "Insulated hot-water tank", "TANK", "storage", 64, 54),
    c("heatLoad", "Hot water and space heat", "LOAD", "load", 84, 38),
  ], { collectorAreaM2: 6, tankVolumeL: 300, solarResourceKwhM2Day: 4.6, thermalEfficiency: 0.48, criticalLoadKw: 0.45, autonomyHours: 8 }),
  wind: project("wind", "Wind Generation + Water Lifting", [
    c("windTurbine", "Small wind turbine", "WIND", "source", 20, 68),
    c("windController", "Wind controller", "CTRL", "conversion", 47, 54),
    c("battery", "Electrical storage", "BAT", "storage", 67, 58),
    c("home", "Property loads", "LOAD", "load", 85, 38),
    c("waterPump", "Direct wind pump", "PUMP", "conversion", 47, 72),
    c("liftTank", "Lifted-water storage", "H₂O", "storage", 73, 28),
  ], { rotorDiameterM: 5, windSpeedMs: 5.5, windPowerCoefficient: 0.3, windAvailability: 0.85, batteryCapacityKwh: 10, criticalLoadKw: 0.35, autonomyHours: 12 }),
  "flow-power": project("flow-power", "Water Flow + Pressure Recovery", [
    c("waterIntake", "Stream or pressure intake", "FLOW", "source", 24, 27),
    c("flowTurbine", "Micro-hydro turbine", "T", "conversion", 48, 59),
    c("flowController", "Power controller", "CTRL", "conversion", 62, 56),
    c("battery", "Electrical storage", "BAT", "storage", 73, 62),
    c("home", "Property loads", "LOAD", "load", 86, 39),
  ], { flowLps: 4, pipeDiameterM: 0.063, flowEfficiency: 0.58, batteryCapacityKwh: 5, criticalLoadKw: 0.25, autonomyHours: 12 }),
  bioenergy: project("bioenergy", "Biomass + Biogas Conversion", [
    c("feedstock", "Organic feedstock", "BIO", "source", 17, 72),
    c("digester", "Anaerobic digester", "DIG", "conversion", 43, 62),
    c("gasStorage", "Biogas storage", "GAS", "storage", 61, 52),
    c("generator", "CHP generator", "CHP", "conversion", 73, 59),
    c("home", "Electrical loads", "LOAD", "load", 87, 39),
    c("heatLoad", "Useful heat load", "HEAT", "load", 85, 73),
  ], { feedstockKgDay: 80, gasStorageM3: 8, biogasYieldM3Kg: 0.06, biogasEnergyKwhM3: 6, generatorEfficiency: 0.3, criticalLoadKw: 0.2, autonomyHours: 12 }),
  "thermal-recovery": project("thermal-recovery", "Recovered Heat Loop", [
    c("wasteHeat", "Waste-heat source", "WASTE", "source", 20, 66),
    c("heatExchanger", "Recovery exchanger", "HX", "conversion", 49, 64),
    c("thermalBuffer", "Thermal buffer", "BUFFER", "storage", 67, 54),
    c("heatLoad", "Heating load", "LOAD", "load", 85, 38),
  ], { wasteHeatKw: 2.5, recoveryHours: 8, recoveryEfficiency: 0.65, bufferKwh: 8, criticalLoadKw: 0.35, autonomyHours: 8 }),
  "mechanical-human": project("mechanical-human", "Mechanical + Human Power", [
    c("pedalDrive", "Pedal or hand drive", "MOVE", "source", 20, 66),
    c("transmission", "Mechanical transmission", "DRIVE", "conversion", 48, 60),
    c("directPump", "Direct water pump", "PUMP", "load", 68, 72),
    c("generator", "Low-voltage generator", "GEN", "conversion", 65, 51),
    c("battery", "Emergency storage", "BAT", "storage", 77, 53),
    c("essentialLoad", "Essential loads", "LOAD", "load", 88, 38),
  ], { inputPowerW: 150, operationHours: 3, mechanicalEfficiency: 0.65, batteryCapacityKwh: 1, criticalLoadKw: 0.1, autonomyHours: 4 }),
  "gravity-storage": referenceProject,
  "coordinated-hybrid": project("coordinated-hybrid", "Coordinated Property Hybrid", [
    c("solar", "Solar generation", "SUN", "source", 16, 68),
    c("windTurbine", "Wind generation", "WIND", "source", 29, 30),
    c("flowTurbine", "Flow recovery", "FLOW", "source", 31, 76),
    c("hybridController", "Hybrid controller", "MIX", "conversion", 52, 56),
    c("battery", "Shared electrical storage", "BAT", "storage", 69, 57),
    c("waterPump", "Renewable water lift", "PUMP", "conversion", 56, 74),
    c("liftTank", "Lifted-water storage", "H₂O", "storage", 74, 27),
    c("home", "Priority property loads", "LOAD", "load", 87, 40),
  ], { hybridSolarKw: 3, hybridWindKw: 2, hybridFlowKw: 0.4, batteryCapacityKwh: 20, criticalLoadKw: 0.8, autonomyHours: 12 }),
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => { const factor = 10 ** digits; return Math.round(value * factor) / factor; };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const terrainElevation = (point: Point) => 68 - point.y * 0.78 + point.x * 0.04;
const value = (label: string, amount: number | null, unit: string, truth: TruthState = "calculated"): TruthValue => ({ label, value: amount, unit, truth });
const required = (p: ProjectModel, key: string) => { const amount = p.parameters[key]; if (typeof amount !== "number") throw new Error(`Missing ${key} for ${p.familyId}`); return amount; };
const component = (p: ProjectModel, id: string) => { const item = p.components[id]; if (!item) throw new Error(`Missing ${id} for ${p.familyId}`); return item; };
const activeFailure = (p: ProjectModel) => p.failures.activeFailure || p.failures.intakeBlocked || p.failures.inverterOffline;
const variant = (componentItem: EnergyComponent) => COMPONENT_VARIANTS.find((item) => item.id === componentItem.variantId) ?? COMPONENT_VARIANTS[1];
const averageVariantFactor = (p: ProjectModel, kinds: EnergyComponent["kind"][], field: "performanceFactor" | "storageFactor" | "costFactor") => {
  const selected = Object.values(p.components).filter((item) => kinds.includes(item.kind));
  return selected.length === 0 ? 1 : selected.reduce((sum, item) => sum + variant(item)[field], 0) / selected.length;
};
const pathPerformanceFactor = (p: ProjectModel) => averageVariantFactor(p, ["source", "conversion"], "performanceFactor");
const storagePerformanceFactor = (p: ProjectModel) => averageVariantFactor(p, ["storage"], "storageFactor");
const projectCostFactor = (p: ProjectModel) => averageVariantFactor(p, ["source", "conversion", "storage", "load"], "costFactor");
export const resourceAvailabilityFactor = (p: ProjectModel) => {
  const r = p.property.resources;
  const level: Record<EnergyFamilyId, number> = {
    "solar-pv": r.solar,
    "solar-thermal": r.solar,
    wind: r.wind,
    "flow-power": r.waterFlow,
    bioenergy: r.biomass,
    "thermal-recovery": r.wasteHeat,
    "mechanical-human": r.humanMotion,
    "gravity-storage": Math.min(r.waterStorage, r.elevation),
    "coordinated-hybrid": Math.max(r.solar, r.wind, r.waterFlow, Math.min(r.waterStorage, r.elevation)),
  };
  return level[p.familyId] / 2;
};

export function createReferenceProject(familyId: LiveFamilyId, revision = 1, property?: PropertyProfile): ProjectModel {
  const source = references[familyId];
  return {
    ...source,
    revision,
    components: Object.fromEntries(Object.entries(source.components).map(([id, item]) => [id, { ...item, position: { ...item.position } }])),
    parameters: { ...source.parameters },
    property: property ? { ...property, resources: { ...property.resources } } : { ...source.property, resources: { ...source.property.resources } },
    failures: { ...source.failures },
  };
}

const cost = (familyId: EnergyFamilyId, p: ProjectModel): CostEstimate => {
  const entries: Record<EnergyFamilyId, CostEstimate> = {
    "solar-pv": { accessible: { low: 7000, high: 15000 }, installed: { low: 17000, high: 26000 }, currency: "USD", truth: "estimated", basis: `${p.parameters.solarArrayKw ?? 2.6} kW PV plus ${p.parameters.batteryCapacityKwh ?? 10} kWh storage; incentives excluded.`, sourceLabel: "NREL 2024 residential PV and storage benchmarks", sourceUrl: "https://atb.nrel.gov/electricity/2024/residential_pv", sourceYear: "2023–2024" },
    "solar-thermal": { accessible: { low: 2500, high: 5000 }, installed: { low: 5000, high: 9000 }, currency: "USD", truth: "estimated", basis: `${p.parameters.collectorAreaM2 ?? 6} m² collector and ${p.parameters.tankVolumeL ?? 300} L storage; distribution upgrades excluded.`, sourceLabel: "U.S. DOE Residential Renewable Energy Guide", sourceUrl: "https://www.energy.gov/sites/default/files/2022-08/ES-ConsumerGuide-Residential-Renewable-Energy.pdf", sourceYear: "2022" },
    wind: { accessible: { low: 6000, high: 18000 }, installed: { low: 20000, high: 70000 }, currency: "USD", truth: "estimated", basis: `${p.parameters.rotorDiameterM ?? 5} m rotor reference; tower, permitting, and interconnection drive the range.`, sourceLabel: "U.S. DOE Small Wind Guidebook", sourceUrl: "https://www.energy.gov/cmei/systems/windexchange/small-wind-guidebook", sourceYear: "2021–2026" },
    "flow-power": { accessible: { low: 3000, high: 12000 }, installed: { low: 12000, high: 60000 }, currency: "USD", truth: "estimated", basis: "Planning envelope for intake, conveyance, turbine, controls, and electrical work; civil works are site-specific.", sourceLabel: "DOE hydropower system boundary; site quote required", sourceUrl: "https://www.energy.gov/cmei/water/types-hydropower-plants", sourceYear: "2026" },
    bioenergy: { accessible: { low: 3000, high: 20000 }, installed: { low: 100000, high: 1800000 }, currency: "USD", truth: "estimated", basis: "Small thermal-use equipment through farm-scale digester/CHP; feedstock handling and compliance dominate scale.", sourceLabel: "U.S. EPA AgSTAR planning and project evidence", sourceUrl: "https://www.epa.gov/agstar/project-planning-and-financing", sourceYear: "2026" },
    "thermal-recovery": { accessible: { low: 800, high: 4000 }, installed: { low: 4000, high: 25000 }, currency: "USD", truth: "estimated", basis: "Heat exchanger, insulated loop, controls, buffer, and installation; process integration excluded.", sourceLabel: "U.S. DOE Building Science heat-recovery guidance", sourceUrl: "https://bsesc.energy.gov/energy-basics/hvac-energy-recovery-ventilation", sourceYear: "2026" },
    "mechanical-human": { accessible: { low: 300, high: 2500 }, installed: { low: 2500, high: 12000 }, currency: "USD", truth: "estimated", basis: "Direct-drive, pumping, low-voltage generation, storage, guards, and mounting; vendor quotes required.", sourceLabel: "EnergyCircle component planning envelope", sourceUrl: null, sourceYear: "2026" },
    "gravity-storage": { accessible: { low: 12000, high: 45000 }, installed: { low: 45000, high: 250000 }, currency: "USD", truth: "estimated", basis: `${p.parameters.reservoirVolumeM3 ?? 135} m³ storage, pump/turbine, conveyance, controls, and civil work; excavation and geotechnical conditions can dominate.`, sourceLabel: "DOE pumped-storage system boundary; property-scale quote required", sourceUrl: "https://www.energy.gov/cmei/water/pumped-storage-hydropower", sourceYear: "2026" },
    "coordinated-hybrid": { accessible: { low: 18000, high: 55000 }, installed: { low: 55000, high: 220000 }, currency: "USD", truth: "estimated", basis: "Combined source, shared storage, controller, water-lift, protection, and integration envelope; not a vendor quote.", sourceLabel: "Derived from the active family planning envelopes", sourceUrl: null, sourceYear: "2026" },
  };
  const base = entries[familyId];
  const factor = projectCostFactor(p);
  const scale = (amount: number) => Math.round(amount * factor / 10) * 10;
  return {
    ...base,
    accessible: { low: scale(base.accessible.low), high: scale(base.accessible.high) },
    installed: { low: scale(base.installed.low), high: scale(base.installed.high) },
    basis: `${base.basis} Active component selections apply a ${round(factor, 2)}Ã— planning-cost factor.`,
  };
};

function finalize(
  p: ProjectModel,
  metrics: { resource: TruthValue; loss: TruthValue; storage: TruthValue; production: TruthValue; runtime: TruthValue; target: TruthValue },
  warnings: EngineWarning[],
  assumptions: EngineResult["assumptions"],
  unknowns: EngineResult["unknowns"],
  limitingFactor: string,
  nextMeasurement: string,
  feasibilityOverride?: Feasibility,
): EngineResult {
  const availability = resourceAvailabilityFactor(p);
  const adjustedProduction = typeof metrics.production.value === "number"
    ? { ...metrics.production, value: round(metrics.production.value * availability, 2) }
    : metrics.production;
  const adjustedMetrics = { ...metrics, production: adjustedProduction };
  const governedWarnings = [...warnings];
  if (availability === 0) governedWarnings.unshift({ id: "property-resource-absent", severity: "critical", title: "Required property resource is absent", detail: "The structured property brief marks the active family's governing resource as unavailable, so useful output is zero." });
  else if (availability < 1) governedWarnings.push({ id: "property-resource-limited", severity: "warning", title: "Property resource is provisional", detail: "The property brief marks this resource as possible rather than strong; modeled output is derated until it is measured." });
  const production = Number(adjustedMetrics.production.value ?? 0);
  const storage = Number(adjustedMetrics.storage.value ?? 0);
  const target = Number(metrics.target.value ?? 0);
  let feasibility: Feasibility = "VIABLE";
  if (activeFailure(p) || production < target * 0.65 || (storage > 0 && storage < target * 0.65)) feasibility = "INFEASIBLE";
  else if (production < target || (storage > 0 && storage < target) || governedWarnings.some((warning) => warning.severity === "warning")) feasibility = "FRAGILE";
  if (feasibilityOverride) feasibility = feasibilityOverride;
  return {
    projectRevision: p.revision, familyId: p.familyId, feasibility,
    resourceMetric: adjustedMetrics.resource, lossMetric: adjustedMetrics.loss, storageMetric: adjustedMetrics.storage,
    productionMetric: adjustedMetrics.production, runtimeMetric: adjustedMetrics.runtime, targetMetric: adjustedMetrics.target,
    headlineMetrics: [adjustedMetrics.resource, adjustedMetrics.loss, adjustedMetrics.production, adjustedMetrics.runtime], warnings: governedWarnings,
    assumptions, unknowns, cost: cost(p.familyId, p), limitingFactor, nextMeasurement,
  };
}

function evaluateGravity(p: ProjectModel): EngineResult {
  const upper = component(p, "upperReservoir").position;
  const lower = component(p, "lowerReservoir").position;
  const turbine = component(p, "turbine").position;
  const grossHead = Math.max(0, terrainElevation(upper) - terrainElevation(lower));
  const routeLength = (distance(upper, turbine) + distance(turbine, lower)) * 1.02;
  const diameter = required(p, "pipeDiameterM");
  const area = Math.PI * diameter ** 2 / 4;
  const failed = activeFailure(p);
  const flow = failed ? 0 : required(p, "designFlowM3s");
  const velocity = area > 0 ? flow / area : 0;
  const velocityHead = velocity ** 2 / (2 * 9.81);
  const headLoss = required(p, "frictionFactor") * (routeLength / diameter) * velocityHead + required(p, "minorLossCoefficient") * velocityHead;
  const netHead = Math.max(0, grossHead - headLoss);
  const efficiency = required(p, "turbineEfficiency") * required(p, "generatorEfficiency") * pathPerformanceFactor(p);
  const storedEnergy = (1000 * 9.81 * required(p, "reservoirVolumeM3") * storagePerformanceFactor(p) * netHead * efficiency) / 3_600_000;
  const generatedPower = (1000 * 9.81 * flow * netHead * efficiency) / 1000;
  const requiredEnergy = required(p, "criticalLoadKw") * required(p, "autonomyHours");
  const runtime = storedEnergy / required(p, "criticalLoadKw");
  const lossPercent = grossHead > 0 ? headLoss / grossHead * 100 : 100;
  const warnings: EngineWarning[] = [];
  if (failed) warnings.push({ id: "intake-blocked", severity: "critical", title: "Water path interrupted", detail: "The active intake failure reduces flow and turbine generation to zero." });
  if (generatedPower < required(p, "criticalLoadKw")) warnings.push({ id: "power-shortfall", severity: generatedPower === 0 ? "critical" : "warning", title: "Generation below critical load", detail: "Current net head and flow do not carry the defined critical load." });
  if (storedEnergy < requiredEnergy) warnings.push({ id: "storage-shortfall", severity: storedEnergy < requiredEnergy * 0.65 ? "critical" : "warning", title: "Autonomy target not met", detail: "Calculated stored energy is below the defined autonomy energy." });
  if (lossPercent > 25) warnings.push({ id: "route-loss", severity: lossPercent > 40 ? "critical" : "warning", title: "Pipe loss consumes available head", detail: "Diameter, flow, and route length consume a material share of gross head." });
  let gravityFeasibility: Feasibility = "VIABLE";
  if (failed || netHead <= 0 || generatedPower < required(p, "criticalLoadKw") * 0.5 || storedEnergy < requiredEnergy * 0.65) gravityFeasibility = "INFEASIBLE";
  else if (generatedPower < required(p, "criticalLoadKw") || storedEnergy < requiredEnergy || lossPercent > 25) gravityFeasibility = "FRAGILE";
  return finalize(p, {
    resource: value("Net head", round(netHead), "m"), loss: value("Head loss", round(lossPercent), "%"),
    storage: value("Stored energy", round(storedEnergy, 2), "kWh"), production: value("Generation capacity", round(generatedPower, 2), "kW"),
    runtime: value("Critical-load runtime", round(runtime, 1), "h"), target: value("Autonomy target", round(requiredEnergy, 1), "kWh"),
  }, warnings, [
    { label: "Terrain elevations", value: "Reference contour model", truth: "assumed" },
    { label: "Design flow", value: `${required(p, "designFlowM3s") * 1000} L/s`, truth: "assumed" },
    { label: "Conversion efficiency", value: `${round(efficiency * 100, 0)}%`, truth: "assumed" },
    { label: "Active component performance", value: `${round(pathPerformanceFactor(p) * 100, 0)}% of standard reference`, truth: "estimated" },
  ], [{ label: "Geotechnical conditions", truth: "unknown" }, { label: "Permit requirements", truth: "unknown" }],
  storedEnergy < requiredEnergy ? "Usable elevation, water volume, and hydraulic loss limit the autonomy window." : "The defined storage and head meet the current autonomy target.",
  "Measure upper and lower water elevations, usable volume, route length, and sustainable pipe flow.", gravityFeasibility);
}

function placementFactor(p: ProjectModel, id: string, preferred: "high" | "near", targetId?: string) {
  const position = component(p, id).position;
  if (preferred === "high") return clamp(0.5 + (70 - position.y) * 0.009 + (position.x - 20) * 0.002, 0.45, 1);
  const target = component(p, targetId ?? id).position;
  return clamp(1 - distance(position, target) / 120, 0.55, 1);
}

function evaluateSolar(p: ProjectModel): EngineResult {
  const arrayPosition = component(p, "solar").position;
  const shadeFactor = clamp(1 - Math.max(0, arrayPosition.y - 48) * 0.012 - Math.max(0, 30 - arrayPosition.x) * 0.004, 0.5, 1);
  const shadeLoss = (1 - shadeFactor) * 100;
  const effectiveSun = required(p, "peakSunHours") * shadeFactor;
  const failed = activeFailure(p);
  const dailyHarvest = failed ? 0 : required(p, "solarArrayKw") * effectiveSun * required(p, "solarDerate") * pathPerformanceFactor(p);
  const usableBattery = required(p, "batteryCapacityKwh") * required(p, "batteryUsableFraction") * required(p, "inverterEfficiency") * storagePerformanceFactor(p);
  const target = required(p, "criticalLoadKw") * required(p, "autonomyHours");
  const runtime = usableBattery / required(p, "criticalLoadKw");
  const warnings: EngineWarning[] = [];
  if (failed) warnings.push({ id: "inverter-offline", severity: "critical", title: "Conversion path interrupted", detail: "The active inverter failure reduces usable AC production to zero." });
  if (dailyHarvest < target) warnings.push({ id: "solar-harvest-shortfall", severity: dailyHarvest < target * 0.65 ? "critical" : "warning", title: "Daily solar harvest below target", detail: "Sunlight, placement, capacity, and derating do not replenish the defined autonomy energy in one reference day." });
  if (usableBattery < target) warnings.push({ id: "storage-shortfall", severity: usableBattery < target * 0.65 ? "critical" : "warning", title: "Usable battery energy below target", detail: "Nominal storage is reduced by usable fraction and inverter efficiency." });
  if (shadeLoss > 20) warnings.push({ id: "array-shading", severity: "warning", title: "Array placement reduces solar access", detail: "The array overlaps the modeled obstruction zone." });
  return finalize(p, {
    resource: value("Effective sun", round(effectiveSun, 1), "h/day"), loss: value("Modeled shading", round(shadeLoss), "%"),
    storage: value("Usable battery", round(usableBattery, 2), "kWh"), production: value("Daily harvest", round(dailyHarvest, 2), "kWh/day"),
    runtime: value("Critical-load runtime", round(runtime, 1), "h"), target: value("Daily energy target", round(target, 1), "kWh"),
  }, warnings, [
    { label: "Peak sun resource", value: `${required(p, "peakSunHours")} h/day`, truth: "assumed" },
    { label: "System derating", value: `${round((1 - required(p, "solarDerate")) * 100, 0)}%`, truth: "assumed" },
    { label: "Usable battery fraction", value: `${round(required(p, "batteryUsableFraction") * 100, 0)}%`, truth: "assumed" },
    { label: "Active component performance", value: `${round(pathPerformanceFactor(p) * 100, 0)}% of standard reference`, truth: "estimated" },
  ], [{ label: "Measured roof shading", truth: "unknown" }, { label: "Interconnection requirements", truth: "unknown" }],
  shadeLoss > 20 ? "Modeled shade is the largest visible constraint on daily harvest." : dailyHarvest < target ? "Array capacity limits daily replenishment." : "The defined array and storage meet the modeled critical-load target.",
  "Measure seasonal shade, roof or ground area, electrical loads, and service-panel constraints.");
}

function genericEvaluation(p: ProjectModel): EngineResult {
  const failed = activeFailure(p);
  let resource = value("Resource", 0, "");
  let loss = value("Modeled loss", 0, "%");
  let storage = value("Storage", 0, "kWh");
  let production = value("Useful energy", 0, "kWh/day");
  let runtime = value("Load coverage", 0, "h");
  let target = value("Energy target", round(required(p, "criticalLoadKw") * required(p, "autonomyHours"), 1), "kWh");
  let placementLoss = 0;
  let limitingFactor = "The defined source and storage meet the modeled target.";
  let nextMeasurement = "Confirm the assumed resource and actual priority loads.";
  const assumptions: EngineResult["assumptions"] = [];
  const unknowns: EngineResult["unknowns"] = [];

  if (p.familyId === "solar-thermal") {
    const factor = placementFactor(p, "collector", "high");
    placementLoss = (1 - factor) * 100;
    const daily = failed ? 0 : required(p, "collectorAreaM2") * required(p, "solarResourceKwhM2Day") * required(p, "thermalEfficiency") * factor;
    const tankKwh = required(p, "tankVolumeL") * 4.186 * 35 / 3600;
    resource = value("Effective solar heat", round(required(p, "solarResourceKwhM2Day") * factor, 1), "kWh/m²/day");
    loss = value("Placement loss", round(placementLoss), "%"); storage = value("Thermal storage", round(tankKwh, 1), "kWhₜₕ");
    production = value("Useful heat", round(daily, 1), "kWhₜₕ/day"); runtime = value("Heat-load coverage", round(tankKwh / required(p, "criticalLoadKw"), 1), "h");
    target = value("Thermal target", round(required(p, "criticalLoadKw") * required(p, "autonomyHours"), 1), "kWhₜₕ");
    limitingFactor = daily < Number(target.value) ? "Collector area and solar access limit daily useful heat." : "Collector and tank capacity meet the defined thermal target.";
    nextMeasurement = "Measure seasonal solar exposure, hot-water use, delivery temperature, and available tank space.";
    assumptions.push({ label: "Collector efficiency", value: `${round(required(p, "thermalEfficiency") * 100)}%`, truth: "assumed" }, { label: "Useful temperature rise", value: "35 °C", truth: "assumed" });
    unknowns.push({ label: "Existing plumbing compatibility", truth: "unknown" }, { label: "Freeze protection requirement", truth: "unknown" });
  } else if (p.familyId === "wind") {
    const factor = placementFactor(p, "windTurbine", "high");
    const effectiveWind = required(p, "windSpeedMs") * factor;
    const area = Math.PI * (required(p, "rotorDiameterM") / 2) ** 2;
    const power = failed ? 0 : 0.5 * 1.225 * area * required(p, "windPowerCoefficient") * effectiveWind ** 3 / 1000;
    const daily = power * 24 * required(p, "windAvailability");
    placementLoss = (1 - factor) * 100;
    resource = value("Effective wind", round(effectiveWind, 1), "m/s"); loss = value("Obstruction loss", round(placementLoss), "%");
    storage = value("Electrical storage", required(p, "batteryCapacityKwh"), "kWh", "assumed"); production = value("Daily generation", round(daily, 1), "kWh/day");
    runtime = value("Storage runtime", round(required(p, "batteryCapacityKwh") / required(p, "criticalLoadKw"), 1), "h");
    limitingFactor = effectiveWind < 4.5 ? "The assumed wind resource and obstruction reduce useful production." : daily < Number(target.value) ? "Rotor swept area limits daily harvest." : "The wind resource and storage meet the defined target.";
    nextMeasurement = "Record hub-height wind speed, turbulence, obstacle height, setbacks, and tower access.";
    assumptions.push({ label: "Air density", value: "1.225 kg/m³", truth: "assumed" }, { label: "Power coefficient", value: `${round(required(p, "windPowerCoefficient") * 100)}%`, truth: "assumed" });
    unknowns.push({ label: "Hub-height wind measurement", truth: "unknown" }, { label: "Tower and zoning approval", truth: "unknown" });
  } else if (p.familyId === "flow-power") {
    const intake = component(p, "waterIntake").position;
    const turbine = component(p, "flowTurbine").position;
    const grossHead = Math.max(0, terrainElevation(intake) - terrainElevation(turbine));
    const routeM = distance(intake, turbine) * 1.1;
    const diameter = required(p, "pipeDiameterM");
    const flowM3s = required(p, "flowLps") / 1000;
    const area = Math.PI * diameter ** 2 / 4;
    const velocity = flowM3s / area;
    const headLoss = 0.026 * routeM / diameter * velocity ** 2 / (2 * 9.81);
    const netHead = Math.max(0, grossHead - headLoss);
    const power = failed ? 0 : 1000 * 9.81 * flowM3s * netHead * required(p, "flowEfficiency") / 1000;
    const daily = power * 24;
    placementLoss = grossHead > 0 ? headLoss / grossHead * 100 : 100;
    resource = value("Net water head", round(netHead, 1), "m"); loss = value("Conveyance loss", round(placementLoss), "%");
    storage = value("Electrical storage", required(p, "batteryCapacityKwh"), "kWh", "assumed"); production = value("Continuous energy", round(daily, 1), "kWh/day");
    runtime = value("Storage runtime", round(required(p, "batteryCapacityKwh") / required(p, "criticalLoadKw"), 1), "h");
    limitingFactor = netHead <= 0 ? "The current intake and turbine geometry provides no usable net head." : power < required(p, "criticalLoadKw") ? "Flow, net head, or pipe loss limits continuous power." : "The modeled flow path carries the defined critical load.";
    nextMeasurement = "Measure year-round flow or pressure, intake elevation, return elevation, route length, and water rights.";
    assumptions.push({ label: "Turbine and generator efficiency", value: `${round(required(p, "flowEfficiency") * 100)}%`, truth: "assumed" }, { label: "Continuous resource", value: "24 h/day", truth: "assumed" });
    unknowns.push({ label: "Seasonal low flow", truth: "unknown" }, { label: "Water rights and screening", truth: "unknown" });
  } else if (p.familyId === "bioenergy") {
    const routeFactor = placementFactor(p, "feedstock", "near", "digester");
    placementLoss = (1 - routeFactor) * 100;
    const gas = required(p, "feedstockKgDay") * required(p, "biogasYieldM3Kg") * routeFactor;
    const daily = failed ? 0 : gas * required(p, "biogasEnergyKwhM3") * required(p, "generatorEfficiency");
    const gasKwh = required(p, "gasStorageM3") * required(p, "biogasEnergyKwhM3") * required(p, "generatorEfficiency");
    resource = value("Biogas production", round(gas, 1), "m³/day"); loss = value("Handling loss", round(placementLoss), "%");
    storage = value("Usable gas energy", round(gasKwh, 1), "kWh"); production = value("Electrical output", round(daily, 1), "kWh/day");
    runtime = value("Stored-gas runtime", round(gasKwh / required(p, "criticalLoadKw"), 1), "h");
    limitingFactor = daily < Number(target.value) ? "Feedstock quantity, gas yield, and conversion efficiency limit useful output." : "Feedstock and gas storage meet the defined load target.";
    nextMeasurement = "Characterize daily feedstock mass, moisture, composition, seasonal continuity, and useful heat demand.";
    assumptions.push({ label: "Biogas yield", value: `${required(p, "biogasYieldM3Kg")} m³/kg`, truth: "assumed" }, { label: "Electrical efficiency", value: `${round(required(p, "generatorEfficiency") * 100)}%`, truth: "assumed" });
    unknowns.push({ label: "Feedstock laboratory characterization", truth: "unknown" }, { label: "Gas handling and environmental permits", truth: "unknown" });
  } else if (p.familyId === "thermal-recovery") {
    const routeFactor = placementFactor(p, "heatExchanger", "near", "wasteHeat");
    placementLoss = (1 - routeFactor) * 100;
    const daily = failed ? 0 : required(p, "wasteHeatKw") * required(p, "recoveryHours") * required(p, "recoveryEfficiency") * routeFactor;
    resource = value("Available waste heat", required(p, "wasteHeatKw"), "kWₜₕ", "assumed"); loss = value("Route loss", round(placementLoss), "%");
    storage = value("Thermal buffer", required(p, "bufferKwh"), "kWhₜₕ", "assumed"); production = value("Recovered heat", round(daily, 1), "kWhₜₕ/day");
    runtime = value("Buffer coverage", round(required(p, "bufferKwh") / required(p, "criticalLoadKw"), 1), "h"); target = value("Thermal target", Number(target.value), "kWhₜₕ");
    limitingFactor = daily < Number(target.value) ? "Available waste heat, operating hours, or route loss limits recovery." : "The recovery loop offsets the defined thermal target.";
    nextMeasurement = "Measure source and return temperatures, simultaneous operating hours, flow, and load timing.";
    assumptions.push({ label: "Recovery efficiency", value: `${round(required(p, "recoveryEfficiency") * 100)}%`, truth: "assumed" }, { label: "Available hours", value: `${required(p, "recoveryHours")} h/day`, truth: "assumed" });
    unknowns.push({ label: "Measured temperature profile", truth: "unknown" }, { label: "Fouling and material compatibility", truth: "unknown" });
  } else if (p.familyId === "mechanical-human") {
    const routeFactor = placementFactor(p, "pedalDrive", "near", "transmission");
    placementLoss = (1 - routeFactor) * 100;
    const daily = failed ? 0 : required(p, "inputPowerW") / 1000 * required(p, "operationHours") * required(p, "mechanicalEfficiency") * routeFactor;
    const usableStorage = Math.min(required(p, "batteryCapacityKwh"), daily);
    resource = value("Sustained input", required(p, "inputPowerW"), "W", "assumed"); loss = value("Drive and route loss", round(placementLoss + (1 - required(p, "mechanicalEfficiency")) * 100), "%");
    storage = value("Daily stored energy", round(usableStorage, 2), "kWh"); production = value("Useful daily work", round(daily, 2), "kWh/day");
    runtime = value("Essential-load runtime", round(usableStorage / required(p, "criticalLoadKw"), 1), "h");
    limitingFactor = daily < Number(target.value) ? "Human power and available operating time constrain the loads this path can serve." : "The defined essential load fits within the modeled daily work.";
    nextMeasurement = "Identify direct mechanical loads, realistic operators, duty cycle, ergonomics, and required guards.";
    assumptions.push({ label: "Sustained human input", value: `${required(p, "inputPowerW")} W`, truth: "assumed" }, { label: "Drive efficiency", value: `${round(required(p, "mechanicalEfficiency") * 100)}%`, truth: "assumed" });
    unknowns.push({ label: "Operator-specific sustainable output", truth: "unknown" }, { label: "Mechanical guarding design", truth: "unknown" });
  } else {
    const solar = required(p, "hybridSolarKw") * 4.6 * 0.77;
    const wind = required(p, "hybridWindKw") * 24 * 0.25;
    const flow = required(p, "hybridFlowKw") * 24;
    const controllerFactor = placementFactor(p, "hybridController", "near", "home");
    placementLoss = (1 - controllerFactor) * 100;
    const daily = failed ? 0 : (solar + wind + flow) * controllerFactor;
    resource = value("Source diversity", [solar, wind, flow].filter((amount) => amount > 0).length, "active paths"); loss = value("Integration loss", round(placementLoss), "%");
    storage = value("Shared storage", required(p, "batteryCapacityKwh") * 0.85, "kWh"); production = value("Combined supply", round(daily, 1), "kWh/day");
    runtime = value("Priority-load runtime", round(required(p, "batteryCapacityKwh") * 0.85 / required(p, "criticalLoadKw"), 1), "h");
    limitingFactor = daily < Number(target.value) ? "The combined sources do not replenish the priority-load target." : "Multiple sources meet the target, but shared controls and storage remain common dependencies.";
    nextMeasurement = "Measure each source independently, define priority loads, and document which failures may share wiring, storage, or controls.";
    assumptions.push({ label: "Solar resource", value: "4.6 peak-sun h/day", truth: "assumed" }, { label: "Wind capacity factor", value: "25%", truth: "assumed" }, { label: "Usable storage fraction", value: "85%", truth: "assumed" });
    unknowns.push({ label: "Coincident seasonal source profile", truth: "unknown" }, { label: "Protection and interconnection design", truth: "unknown" });
  }

  const pathwayFactor = pathPerformanceFactor(p);
  const storageFactor = storagePerformanceFactor(p);
  if (typeof production.value === "number") production = { ...production, value: round(production.value * pathwayFactor, 2) };
  if (typeof storage.value === "number") storage = { ...storage, value: round(storage.value * storageFactor, 2) };
  if (typeof runtime.value === "number") runtime = { ...runtime, value: round(runtime.value * storageFactor, 1) };
  assumptions.push({ label: "Active component performance", value: `${round(pathwayFactor * 100, 0)}% of standard reference`, truth: "estimated" });

  const warnings: EngineWarning[] = [];
  const targetAmount = Number(target.value ?? 0);
  const productionAmount = Number(production.value ?? 0);
  const storageAmount = Number(storage.value ?? 0);
  if (failed) warnings.push({ id: "path-failure", severity: "critical", title: FAMILY_SCENARIOS[p.familyId].failureLabel, detail: FAMILY_SCENARIOS[p.familyId].failureDetail });
  if (productionAmount < targetAmount) warnings.push({ id: "production-shortfall", severity: productionAmount < targetAmount * 0.65 ? "critical" : "warning", title: "Useful output below target", detail: "The deterministic source, conversion, and loss model does not meet the defined energy target." });
  if (storageAmount > 0 && storageAmount < targetAmount) warnings.push({ id: "storage-shortfall", severity: storageAmount < targetAmount * 0.65 ? "critical" : "warning", title: "Storage below autonomy target", detail: "The current storage path cannot carry the defined load for the full autonomy window." });
  if (placementLoss > 20) warnings.push({ id: "placement-loss", severity: "warning", title: "Placement creates a material loss", detail: "Moving the active component changes the governed route or resource factor." });
  return finalize(p, { resource, loss, storage, production, runtime, target }, warnings, assumptions, unknowns, limitingFactor, nextMeasurement);
}

export function evaluateProject(p: ProjectModel): EngineResult {
  if (p.familyId === "gravity-storage") return evaluateGravity(p);
  if (p.familyId === "solar-pv") return evaluateSolar(p);
  return genericEvaluation(p);
}

export function applyMutation(p: ProjectModel, mutation: DomainMutation): ProjectModel {
  if (mutation.type === "move-component") {
    const current = p.components[mutation.id];
    if (!current) return p;
    return { ...p, components: { ...p.components, [mutation.id]: { ...current, position: { x: clamp(mutation.position.x, 4, 96), y: clamp(mutation.position.y, 8, 88) } } } };
  }
  if (mutation.type === "set-parameter") {
    const control = FAMILY_SCENARIOS[p.familyId].controls.find((item) => item.key === mutation.key);
    if (!control) return p;
    return { ...p, parameters: { ...p.parameters, [mutation.key]: clamp(mutation.value, control.min, control.max) } };
  }
  if (mutation.type === "set-active-failure") return { ...p, failures: { ...p.failures, activeFailure: mutation.active, intakeBlocked: false, inverterOffline: false } };
  if (mutation.type === "set-pipe-diameter" && (p.familyId === "gravity-storage" || p.familyId === "flow-power")) return { ...p, parameters: { ...p.parameters, pipeDiameterM: clamp(mutation.valueM, 0.032, p.familyId === "flow-power" ? 0.2 : 0.11) } };
  if (mutation.type === "set-reservoir-volume" && p.familyId === "gravity-storage") return { ...p, parameters: { ...p.parameters, reservoirVolumeM3: clamp(mutation.valueM3, 20, 500) } };
  if (mutation.type === "set-solar-array-capacity" && p.familyId === "solar-pv") return { ...p, parameters: { ...p.parameters, solarArrayKw: clamp(mutation.valueKw, 0.4, 20) } };
  if (mutation.type === "set-battery-capacity" && (p.familyId === "solar-pv" || p.familyId === "wind" || p.familyId === "flow-power" || p.familyId === "mechanical-human" || p.familyId === "coordinated-hybrid")) return { ...p, parameters: { ...p.parameters, batteryCapacityKwh: clamp(mutation.valueKwh, 0.2, 120) } };
  if (mutation.type === "set-critical-load") return { ...p, parameters: { ...p.parameters, criticalLoadKw: clamp(mutation.valueKw, 0.1, 10) } };
  if (mutation.type === "set-autonomy-hours") return { ...p, parameters: { ...p.parameters, autonomyHours: clamp(mutation.valueHours, 1, 72) } };
  if (mutation.type === "set-intake-blocked" && p.familyId === "gravity-storage") return { ...p, failures: { ...p.failures, intakeBlocked: mutation.blocked, activeFailure: false } };
  if (mutation.type === "set-inverter-offline" && p.familyId === "solar-pv") return { ...p, failures: { ...p.failures, inverterOffline: mutation.offline, activeFailure: false } };
  if (mutation.type === "select-component-variant") {
    const current = p.components[mutation.id];
    if (!current || !COMPONENT_VARIANTS.some((item) => item.id === mutation.variantId)) return p;
    return { ...p, components: { ...p.components, [mutation.id]: { ...current, variantId: mutation.variantId } } };
  }
  if (mutation.type === "set-inaction-annual-cost") return { ...p, parameters: { ...p.parameters, annualBaselineCost: clamp(mutation.value, 0, 50000) } };
  if (mutation.type === "set-inaction-disruption-cost") return { ...p, parameters: { ...p.parameters, annualDisruptionCost: clamp(mutation.value, 0, 50000) } };
  if (mutation.type === "set-inaction-years") return { ...p, parameters: { ...p.parameters, inactionYears: clamp(Math.round(mutation.value), 1, 20) } };
  if (mutation.type === "set-property-objective") return { ...p, property: { ...p.property, objective: mutation.objective } };
  if (mutation.type === "set-property-budget") return { ...p, property: { ...p.property, budgetBand: mutation.budgetBand } };
  if (mutation.type === "set-property-resource") return { ...p, property: { ...p.property, resources: { ...p.property.resources, [mutation.resource]: mutation.level } } };
  return p;
}

export function commitMutation(p: ProjectModel, mutation: DomainMutation): ProjectModel {
  const next = applyMutation(p, mutation);
  return JSON.stringify(next) === JSON.stringify(p) ? p : { ...next, revision: p.revision + 1 };
}

export function beginPreview(p: ProjectModel, mutation: DomainMutation): PreviewTransaction { return { base: p, draft: applyMutation(p, mutation), mutation }; }
export function updatePreview(transaction: PreviewTransaction, mutation: DomainMutation): PreviewTransaction { return { ...transaction, draft: applyMutation(transaction.base, mutation), mutation }; }
export function commitPreview(transaction: PreviewTransaction): ProjectModel { return JSON.stringify(transaction.draft) === JSON.stringify(transaction.base) ? transaction.base : { ...transaction.draft, revision: transaction.base.revision + 1 }; }

export function deriveCausalInsight(before: EngineResult, after: EngineResult): string {
  if (after.productionMetric.value === 0 && before.productionMetric.value !== 0) return `${FAMILY_SCENARIOS[after.familyId].failureLabel} interrupts the governed delivery path, so useful output falls to zero.`;
  if (before.productionMetric.value === 0 && after.productionMetric.value !== 0) return `Restoring the failed component reconnects the ${FAMILY_SCENARIOS[after.familyId].flowKinds.map((item) => item.label.toLowerCase()).join(" and ")}.`;
  if (before.feasibility !== after.feasibility) return `This change moves the system from ${before.feasibility.toLowerCase()} to ${after.feasibility.toLowerCase()}: useful output is now ${String(after.productionMetric.value)} ${after.productionMetric.unit} against a ${String(after.targetMetric.value)} ${after.targetMetric.unit} target.`;
  const lossDelta = Number(after.lossMetric.value) - Number(before.lossMetric.value);
  if (Math.abs(lossDelta) >= 2) return `Placement changed ${after.lossMetric.label.toLowerCase()} by ${String(round(Math.abs(lossDelta)))} percentage points; it is now ${String(after.lossMetric.value)}%.`;
  const productionDelta = Number(after.productionMetric.value) - Number(before.productionMetric.value);
  const direction = productionDelta >= 0 ? "increased" : "decreased";
  return `The governed change ${direction} ${after.productionMetric.label.toLowerCase()} by ${String(round(Math.abs(productionDelta), 2))} ${after.productionMetric.unit}.`;
}

export function answerFamilyQuestion(question: string, result: EngineResult): string {
  if (/cost/i.test(question)) {
    return `Accessible configuration: $${result.cost.accessible.low.toLocaleString()}–$${result.cost.accessible.high.toLocaleString()}. Installed planning envelope: $${result.cost.installed.low.toLocaleString()}–$${result.cost.installed.high.toLocaleString()}. These are ${result.cost.truth} ${result.cost.currency} ranges, not quotes.`;
  }
  if (/measure|unknown|site measurement/i.test(question)) return result.nextMeasurement;
  if (/limit|enough wind|organic|realistic|wasted|resources complement|stream|pressure|elevation|water matter/i.test(question)) return result.limitingFactor;
  return result.feasibility === "VIABLE"
    ? `The reference inputs are viable for the defined target. ${result.limitingFactor}`
    : `The reference is ${result.feasibility.toLowerCase()}, not a property conclusion. ${result.limitingFactor} ${result.nextMeasurement}`;
}
