import { ENERGY_FAMILIES, type EnergyFamilyId } from "./architecture-catalog.ts";
import {
  COMPONENT_VARIANTS,
  commitMutation,
  createReferenceProject,
  evaluateProject,
  FAMILY_SCENARIOS,
  type EnergyComponent,
  type EngineResult,
  type Feasibility,
  type ProjectModel,
  type PropertyResourceId,
  type TruthState,
} from "./family-engine.ts";

export interface AssemblyPart {
  number: string;
  name: string;
  function: string;
  interface: string;
  inspection: string;
  failureEffect: string;
}

export interface ExplodedAssembly {
  componentId: string;
  componentLabel: string;
  componentKind: EnergyComponent["kind"];
  variantLabel: string;
  serviceLife: string;
  evidence: string;
  boundary: string;
  parts: AssemblyPart[];
  assemblyOrder: string[];
  serviceAccess: string;
  isolationGate: string;
}

export interface CostOfInaction {
  annualBaselineCost: number;
  annualDisruptionCost: number;
  annualEscalationPercent: number;
  horizonYears: number;
  cumulativeOperatingCost: number;
  cumulativeDisruptionExposure: number;
  combinedExposure: number;
  comparisonToAccessibleLow: number;
  projections: Array<{ years: number; operating: number; disruption: number; combined: number }>;
  truth: "estimated";
  basis: string;
  notMonetized: string[];
  interpretation: string;
}

export interface FamilyMatch {
  familyId: EnergyFamilyId;
  name: string;
  score: number;
  status: "STRONG MATCH" | "POSSIBLE" | "MEASURE FIRST";
  resourceLevel: "available" | "possible" | "not identified";
  reason: string;
  firstMeasurement: string;
  referenceVerdict: Feasibility;
}

export interface ScheduledComponent {
  id: string;
  label: string;
  role: string;
  quantity: number;
  unit: string;
  connectedTo: string[];
  failureMode: string;
  checkpoint: string;
  truth: TruthState;
}

export interface BudgetLine {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  accessible: { low: number; high: number };
  installed: { low: number; high: number };
  basis: string;
  truth: "estimated";
}

export interface ResilienceCase {
  id: string;
  name: string;
  condition: string;
  status: Feasibility;
  usefulOutput: string;
  consequence: string;
}

export interface FieldPhase {
  number: string;
  title: string;
  purpose: string;
  checks: string[];
  boundary?: string;
}

export interface AccessTier {
  id: "existing" | "reclaimed" | "starter" | "staged" | "complete";
  label: string;
  cost: { low: number; high: number };
  costLabel: string;
  service: string;
  modeledOutput: string;
  outputTruth: TruthState;
  requires: string[];
  limitation: string;
  carriesForward: string;
}

export interface EngineeringPackage {
  projectId: string;
  revision: number;
  fingerprint: string;
  generatedFrom: string;
  invariant: string;
  exclusionCriteria: string[];
  componentSchedule: ScheduledComponent[];
  budget: BudgetLine[];
  resilience: ResilienceCase[];
  accessPath: AccessTier[];
  assemblies: ExplodedAssembly[];
  costOfInaction: CostOfInaction;
  familyMatches: FamilyMatch[];
  fieldSequence: FieldPhase[];
  record: {
    project: ProjectModel;
    result: EngineResult;
    scenario: {
      title: string;
      routes: typeof FAMILY_SCENARIOS[EnergyFamilyId]["routes"];
    };
  };
}

const FAMILY_FIELD_NOTES: Record<EnergyFamilyId, {
  measure: string;
  site: string;
  commission: string;
  maintain: string;
  boundary: string;
  resourceKey: string;
  storageKey?: string;
}> = {
  "solar-pv": {
    measure: "Log seasonal shade, roof or ground geometry, and the actual critical-load profile.",
    site: "Confirm array setbacks, cable route, equipment access, and a protected battery location.",
    commission: "Verify polarity, isolation, grounding, inverter limits, and priority-load transfer under controlled conditions.",
    maintain: "Inspect modules, conductors, protection devices, ventilation, and battery health on the manufacturer schedule.",
    boundary: "Permitting, utility interconnection, roof structure, and energized electrical work require qualified review.",
    resourceKey: "solarArrayKw",
    storageKey: "batteryCapacityKwh",
  },
  "solar-thermal": {
    measure: "Log seasonal shade, hot-water demand, incoming-water temperature, and available collector area.",
    site: "Confirm collector support, insulated pipe routing, drain and freeze protection, and tank access.",
    commission: "Pressure-test the loop, purge air, verify circulation and controls, then check delivered temperatures.",
    maintain: "Inspect fluid condition, insulation, valves, pumps, heat exchanger, and over-temperature protection.",
    boundary: "Pressurized hot fluid, roof work, potable-water interfaces, and code compliance require qualified review.",
    resourceKey: "collectorAreaM2",
    storageKey: "tankVolumeL",
  },
  wind: {
    measure: "Measure wind at intended hub height and document turbulence, setbacks, lifting head, and priority loads.",
    site: "Confirm tower footing, fall zone, access, wiring or pump linkage, and storage placement.",
    commission: "Test braking, overspeed protection, controller limits, grounding, and delivery under a controlled wind window.",
    maintain: "Inspect tower tension, fasteners, blades, bearings, conductors, controls, and water-lift linkage.",
    boundary: "Tower engineering, climbing, lifting, overspeed hazards, and electrical work require qualified review.",
    resourceKey: "rotorDiameterM",
    storageKey: "batteryCapacityKwh",
  },
  "flow-power": {
    measure: "Measure seasonal flow or pressure, gross head, route length, water rights, and ecological constraints.",
    site: "Confirm screened intake, bypass path, pipe alignment, turbine access, drainage, and electrical route.",
    commission: "Flush the route, test isolation, confirm operating flow and pressure, then verify controller and load behavior.",
    maintain: "Inspect intake screening, sediment, pipe supports, valves, runner wear, controller, and bypass function.",
    boundary: "Water rights, stream disturbance, pressure vessels, excavation, and electrical work require qualified review.",
    resourceKey: "flowLps",
    storageKey: "batteryCapacityKwh",
  },
  bioenergy: {
    measure: "Characterize feedstock quantity, moisture, contamination, seasonal consistency, gas use, and heat loads.",
    site: "Confirm containment, drainage, gas-safe separation, feed handling, digestate path, and service access.",
    commission: "Leak-test gas equipment, establish biological operation gradually, verify pressure control, and test flare or load paths.",
    maintain: "Track feed rate, temperature, pH, gas quality, pressure devices, condensate, seals, and digestate handling.",
    boundary: "Combustible gas, confined spaces, pathogens, pressure, emissions, and code compliance require specialists.",
    resourceKey: "feedstockKgDay",
    storageKey: "gasStorageM3",
  },
  "thermal-recovery": {
    measure: "Log waste-heat temperature, duration, contamination risk, coincident demand, and pipe distances.",
    site: "Confirm exchanger access, compatible materials, isolation, condensate path, buffer location, and insulation route.",
    commission: "Pressure-test both sides, verify separation, balance flow, and confirm controls across operating states.",
    maintain: "Inspect fouling, corrosion, seals, pumps, insulation, buffer condition, and cross-contamination safeguards.",
    boundary: "Process modification, potable interfaces, pressure, hot surfaces, and combustion equipment require qualified review.",
    resourceKey: "wasteHeatKw",
    storageKey: "bufferKwh",
  },
  "mechanical-human": {
    measure: "Identify the essential task, required shaft work or energy, acceptable effort, duty cycle, and operator limits.",
    site: "Confirm stable mounting, guarding, ergonomic adjustment, direct-drive route, and protected low-voltage storage.",
    commission: "Test guarding, emergency stop, drive alignment, electrical limits, and sustained operator comfort.",
    maintain: "Inspect guards, chain or belt tension, bearings, fasteners, generator, wiring, and battery condition.",
    boundary: "Rotating machinery, pinch points, medical limitations, and battery protection require competent review.",
    resourceKey: "inputPowerW",
    storageKey: "batteryCapacityKwh",
  },
  "gravity-storage": {
    measure: "Survey elevation, usable water volume, pipe route, seasonal water availability, and the critical-load profile.",
    site: "Confirm reservoir containment, overflow, foundations, protected intake, pipe alignment, drainage, and access.",
    commission: "Pressure-test the water path, verify pump and turbine isolation, measure flow and head, then test controlled discharge.",
    maintain: "Inspect containment, intake, sediment, pipe supports, valves, pump, turbine, electrical protection, and overflow.",
    boundary: "Large stored water, excavation, slopes, pressure, dam rules, and grid-connected electrical work require qualified review.",
    resourceKey: "pipeDiameterM",
    storageKey: "reservoirVolumeM3",
  },
  "coordinated-hybrid": {
    measure: "Log each resource independently, the priority-load profile, recharge timing, storage needs, and control objectives.",
    site: "Map source equipment, shared controls, isolation points, storage, priority loads, water service, and maintenance access.",
    commission: "Test each source alone, every isolation state, storage limits, load priority, failover, and safe shutdown.",
    maintain: "Review source performance, controller logs, protection, storage health, water equipment, and failover operation.",
    boundary: "Multi-source protection, controls, interconnection, stored energy, and water infrastructure require qualified review.",
    resourceKey: "hybridSolarKw",
    storageKey: "batteryCapacityKwh",
  },
};

const FAMILY_ACCESS: Record<EnergyFamilyId, {
  existing: string;
  reclaimed: string;
  starter: string;
  existingRequires: string[];
  reclaimedRequires: string[];
  starterRequires: string[];
  existingLimit: string;
  reclaimedLimit: string;
  carry: string;
}> = {
  "solar-pv": {
    existing: "Use daylight, schedule flexible loads into sunny hours, and remove avoidable standby demand before buying generation.",
    reclaimed: "Use a donated or already-owned low-voltage panel and compatible power bank for one isolated DC service such as lighting or communications.",
    starter: "Serve a deliberately small critical-load circuit with a protected panel, controller, storage, and DC or inverter output.",
    existingRequires: ["Existing daylight or sunny operating window", "A measured list of loads that can be shifted or eliminated"],
    reclaimedRequires: ["Known panel and storage ratings", "Compatible charge control, fusing, wiring, enclosure, and connectors"],
    starterRequires: ["Measured solar access", "Defined critical load", "Code-compliant protection and equipment"],
    existingLimit: "Reduces or shifts consumption but does not create stored electricity.",
    reclaimedLimit: "Salvaged equipment condition and compatibility are unknown until tested; never connect improvised equipment to household wiring.",
    carry: "Load measurements, solar survey, protected wiring, and appropriately rated equipment can inform the next stage.",
  },
  "solar-thermal": {
    existing: "Use existing sun for daylight, passive space warming, and solar clothes drying while controlling overheating with shade and ventilation.",
    reclaimed: "Recover reusable insulation, glazing, or an existing dark absorber for a non-potable, non-pressurized demonstration loop.",
    starter: "Serve one bounded thermal load with a purpose-built collector, protected loop, heat exchanger, and small insulated store.",
    existingRequires: ["A useful sunny exposure", "A safe way to prevent unwanted summer heat"],
    reclaimedRequires: ["Materials suitable for expected temperatures", "No potable-water, pressurized, roof, or unattended connection"],
    starterRequires: ["Measured hot-water or heat demand", "Freeze, stagnation, scald, and pressure protection"],
    existingLimit: "Passive gains are seasonal and cannot guarantee hot-water temperature or runtime.",
    reclaimedLimit: "A demonstration collector is not a domestic hot-water appliance and must not be treated as one.",
    carry: "Shade survey, demand log, insulated routing, and measured collector performance remain useful.",
  },
  wind: {
    existing: "Use natural ventilation where climate, openings, and indoor-air conditions allow, and begin a wind observation log at the intended site.",
    reclaimed: "Repurpose an existing mechanical rotor only for a guarded, low-speed direct task or learning rig with no tower or household connection.",
    starter: "Power one small isolated load or lift a limited amount of water with rated equipment and safe overspeed control.",
    existingRequires: ["Safe operable windows or vents", "A site observation period across different weather"],
    reclaimedRequires: ["Guarded rotating parts", "Stable ground-level mounting and a defined direct load"],
    starterRequires: ["Measured wind at operating height", "Setbacks, braking, grounding, and rated storage or direct load"],
    existingLimit: "Ventilation and observation do not produce dependable electrical energy.",
    reclaimedLimit: "An improvised rotor is not safe for a tower, high speed, battery charging, or grid connection.",
    carry: "The wind record, load definition, setbacks, and safe direct-use experiment reduce later uncertainty.",
  },
  "flow-power": {
    existing: "Use existing elevation or pressure for direct water delivery where the route already works without pumping.",
    reclaimed: "Measure seasonal flow, pressure, and head with borrowed tools and prove a low-pressure direct-use route before considering generation.",
    starter: "Serve one small continuous electrical or mechanical load from a verified year-round flow or pressure source.",
    existingRequires: ["A lawful water source", "Existing usable elevation or pressure", "Safe overflow and drainage"],
    reclaimedRequires: ["Seasonal measurements", "A screened, reversible test that does not disturb a waterway"],
    starterRequires: ["Verified minimum flow and net head", "Water rights, bypass, screening, pressure protection, and electrical controls"],
    existingLimit: "Direct delivery is site-dependent and may provide water service without producing electricity.",
    reclaimedLimit: "A short test cannot establish dry-season output, ecological acceptability, or legal use.",
    carry: "Flow duration, head survey, route measurements, and protected intake concepts carry forward.",
  },
  bioenergy: {
    existing: "Separate and measure clean organic residues so their quantity, seasonality, moisture, and existing disposal burden become visible.",
    reclaimed: "Use existing composting or approved biomass practices to reduce waste handling; treat recoverable heat or gas only as unverified potential.",
    starter: "Supply one controlled heat or gas load with purpose-built containment, monitoring, pressure relief, and safe end use.",
    existingRequires: ["A consistent clean feedstock stream", "A safe existing waste-management practice"],
    reclaimedRequires: ["Contamination control", "No improvised gas storage, indoor combustion, or sealed vessel"],
    starterRequires: ["Feedstock characterization", "Gas-safe separation, relief, leak detection, digestate path, and specialist review"],
    existingLimit: "Inventorying or composting feedstock does not create usable governed energy.",
    reclaimedLimit: "Combustible gas and sealed biological vessels are never near-zero-cost DIY shortcuts.",
    carry: "Feedstock logs, siting, containment planning, and heat-load measurements inform a later system.",
  },
  "thermal-recovery": {
    existing: "Reduce avoidable heat loss by coordinating when warm equipment operates, closing unused paths, and using existing heat in the occupied zone when safe.",
    reclaimed: "Reuse suitable insulation or repair existing duct and pipe insulation without altering combustion, refrigeration, exhaust, or potable-water equipment.",
    starter: "Recover one measured low-risk heat stream through a rated exchanger into a bounded thermal load.",
    existingRequires: ["An identifiable waste-heat source", "No indoor-air, moisture, contamination, or combustion penalty"],
    reclaimedRequires: ["Materials rated for the surface temperature", "Access that does not disturb hazardous or code-regulated equipment"],
    starterRequires: ["Measured source temperature and duration", "Compatible exchanger, isolation, flow control, and over-temperature protection"],
    existingLimit: "Operational changes reduce loss but may not move heat to a different load.",
    reclaimedLimit: "Insulation cannot correct unsafe combustion, exhaust, refrigerant, or electrical defects.",
    carry: "Temperature logs, operating schedule, insulation, and load coincidence measurements remain valuable.",
  },
  "mechanical-human": {
    existing: "Use an existing hand, foot, bicycle, pulley, or gravity mechanism directly for a useful task instead of converting motion to electricity.",
    reclaimed: "Adapt a sound existing bicycle or hand drive to a guarded direct pump, grinder, fan, or low-voltage demonstration load.",
    starter: "Provide short-duration emergency charging or direct work with rated transmission, guarding, generator, controls, and small storage.",
    existingRequires: ["An existing mechanism in safe condition", "A task matched to human power and duration"],
    reclaimedRequires: ["Stable mounting", "Guards, alignment, ergonomic fit, and an emergency stop"],
    starterRequires: ["Measured duty cycle", "Rated low-voltage generation, protection, wiring, and storage"],
    existingLimit: "Human output is limited and best used directly; it cannot support ordinary whole-home loads.",
    reclaimedLimit: "Rotating parts, improvised generators, and batteries still require guarding and protection.",
    carry: "The frame, direct-drive task, measured effort, guarding, and low-voltage protection may carry forward.",
  },
  "gravity-storage": {
    existing: "Use an existing elevated tank, pond, spring, or cistern for gravity-fed water service and avoid pumping whenever the measured head is sufficient.",
    reclaimed: "Use existing sound tanks, pipe, and valves for a low-pressure water-transfer test with overflow, drainage, and no electrical generation claim.",
    starter: "Move and release a bounded water volume through a protected route to prove head, flow, loss, and one useful direct-water task.",
    existingRequires: ["Existing lawful stored water above the load", "Verified containment, overflow, route, and water quality for the intended use"],
    reclaimedRequires: ["Pressure-rated reusable components in known condition", "Safe supports, isolation, drainage, and screened intake"],
    starterRequires: ["Surveyed elevation and route", "Known water volume, pipe rating, safe containment, pump or recharge source, and controlled discharge"],
    existingLimit: "Gravity-fed water can avoid pumping but does not automatically provide useful electrical storage.",
    reclaimedLimit: "Unknown tanks, unsupported water mass, buried damage, and unverified pressure components are not acceptable shortcuts.",
    carry: "Survey, water storage, protected routing, measurements, and safe civil work can become part of a larger loop.",
  },
  "coordinated-hybrid": {
    existing: "Coordinate existing daylight, thermal gains, water elevation, manual work, appliance timing, and available generation around priority loads.",
    reclaimed: "Combine already-owned isolated devices operationally—without electrically paralleling incompatible sources or storage.",
    starter: "Create one protected priority-load bus supplied by one verified source while monitoring other resources for later stages.",
    existingRequires: ["A written priority-load order", "Knowledge of when each existing resource and load is available"],
    reclaimedRequires: ["Independent safe devices", "No improvised source paralleling, transfer, or shared battery connection"],
    starterRequires: ["One governed source and storage path", "Isolation, controls, protection, and a documented expansion boundary"],
    existingLimit: "Coordination reduces waste and improves service timing but does not create new energy.",
    reclaimedLimit: "Owning multiple devices does not make them electrically or mechanically compatible.",
    carry: "Priority loads, monitoring, isolation, storage planning, and control objectives become the hybrid foundation.",
  },
};

const ROLE: Record<EnergyComponent["kind"], string> = {
  source: "Captures or supplies the property resource",
  conversion: "Changes the resource into a usable energy form",
  storage: "Buffers supply and demand across time",
  load: "Receives the useful energy or direct work",
};

const FAILURE: Record<EnergyComponent["kind"], string> = {
  source: "Resource capture falls below the modeled input",
  conversion: "The conversion path becomes unavailable or inefficient",
  storage: "Usable capacity or containment is lost",
  load: "Demand exceeds the defined priority-load boundary",
};

const CHECKPOINT: Record<EnergyComponent["kind"], string> = {
  source: "Confirm access to the resource and inspect mounting or intake",
  conversion: "Inspect protection, alignment, controls, and operating temperature",
  storage: "Verify usable capacity, containment, isolation, and condition",
  load: "Re-measure demand and confirm priority circuits or tasks",
};

const money = (value: number) => Math.round(value / 10) * 10;
const output = (result: EngineResult) => result.productionMetric.value === null
  ? "Unknown"
  : `${result.productionMetric.value} ${result.productionMetric.unit}`;

function fingerprint(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `EC-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

function connectedComponents(project: ProjectModel, componentId: string) {
  const routes = FAMILY_SCENARIOS[project.familyId].routes;
  const ids = routes.flatMap((route) => route.from === componentId ? [route.to] : route.to === componentId ? [route.from] : []);
  return [...new Set(ids)].map((id) => project.components[id]?.label).filter((label): label is string => Boolean(label));
}

function buildSchedule(project: ProjectModel): ScheduledComponent[] {
  return Object.values(project.components).map((component) => ({
    id: component.id,
    label: component.label,
    role: ROLE[component.kind],
    quantity: 1,
    unit: "assembly",
    connectedTo: connectedComponents(project, component.id),
    failureMode: FAILURE[component.kind],
    checkpoint: CHECKPOINT[component.kind],
    truth: "assumed",
  }));
}

function buildBudget(project: ProjectModel, result: EngineResult): BudgetLine[] {
  const components = Object.values(project.components);
  const siteWeight = 1.35;
  const weights = components.map((component) => {
    const kindWeight = component.kind === "conversion" ? 1.2 : component.kind === "storage" ? 1.35 : 1;
    const selectedVariant = COMPONENT_VARIANTS.find((item) => item.id === component.variantId) ?? COMPONENT_VARIANTS[1];
    return kindWeight * selectedVariant.costFactor;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, siteWeight);
  const lines = components.map((component, index) => {
    const fraction = weights[index] / totalWeight;
    return {
      id: component.id,
      item: component.label,
      quantity: 1,
      unit: "assembly",
      accessible: { low: money(result.cost.accessible.low * fraction), high: money(result.cost.accessible.high * fraction) },
      installed: { low: money(result.cost.installed.low * fraction), high: money(result.cost.installed.high * fraction) },
      basis: `${COMPONENT_VARIANTS.find((item) => item.id === component.variantId)?.label ?? "Standard new"} planning allowance; verify make, model, rating, condition, equipment price, and local labor before a decision.`,
      truth: "estimated" as const,
    };
  });
  const fraction = siteWeight / totalWeight;
  lines.push({
    id: "site-protection-commissioning",
    item: "Routing, protection, site work, and commissioning",
    quantity: 1,
    unit: "allowance",
    accessible: { low: money(result.cost.accessible.low * fraction), high: money(result.cost.accessible.high * fraction) },
    installed: { low: money(result.cost.installed.low * fraction), high: money(result.cost.installed.high * fraction) },
    basis: "Planning allowance shaped by the current system envelope; permits and exceptional site work may be additional.",
    truth: "estimated" as const,
  });
  return lines;
}

function scenarioResult(project: ProjectModel, mutation: Parameters<typeof commitMutation>[1]) {
  return evaluateProject(commitMutation(project, mutation));
}

function buildResilience(project: ProjectModel, result: EngineResult): ResilienceCase[] {
  const notes = FAMILY_FIELD_NOTES[project.familyId];
  const resourceValue = project.parameters[notes.resourceKey] ?? 0;
  const storageValue = notes.storageKey ? project.parameters[notes.storageKey] ?? 0 : 0;
  const cases = [
    {
      id: "resource-derate",
      name: "Resource or capture at 50%",
      condition: `Reduce ${FAMILY_SCENARIOS[project.familyId].controls.find((control) => control.key === notes.resourceKey)?.label ?? "resource input"} by half.`,
      result: scenarioResult(project, { type: "set-parameter", key: notes.resourceKey, value: resourceValue * 0.5 }),
    },
    ...(notes.storageKey ? [{
      id: "storage-derate",
      name: "Usable storage at 50%",
      condition: "Reduce the modeled storage quantity by half while holding demand constant.",
      result: scenarioResult(project, { type: "set-parameter" as const, key: notes.storageKey, value: storageValue * 0.5 }),
    }] : []),
    {
      id: "demand-surge",
      name: "Priority load +50%",
      condition: "Increase the defined critical load by half without adding generation or storage.",
      result: scenarioResult(project, { type: "set-critical-load", valueKw: project.parameters.criticalLoadKw * 1.5 }),
    },
    {
      id: "path-outage",
      name: FAMILY_SCENARIOS[project.familyId].failureLabel,
      condition: FAMILY_SCENARIOS[project.familyId].failureDetail,
      result: scenarioResult(project, { type: "set-active-failure", active: true }),
    },
  ];
  return [{
    id: "current",
    name: "Current revision",
    condition: "No additional stress applied.",
    status: result.feasibility,
    usefulOutput: output(result),
    consequence: result.limitingFactor,
  }, ...cases.map((item) => ({
    id: item.id,
    name: item.name,
    condition: item.condition,
    status: item.result.feasibility,
    usefulOutput: output(item.result),
    consequence: item.result.limitingFactor,
  }))];
}

function evaluateScale(project: ProjectModel, fraction: number) {
  const scenario = FAMILY_SCENARIOS[project.familyId];
  let scaled = project;
  for (const control of scenario.controls) {
    if (control.key === "criticalLoadKw" || control.key === "autonomyHours") continue;
    const current = project.parameters[control.key] ?? control.min;
    const target = control.min + Math.max(0, current - control.min) * fraction;
    scaled = commitMutation(scaled, { type: "set-parameter", key: control.key, value: target });
  }
  return evaluateProject(scaled);
}

function buildAccessPath(project: ProjectModel, result: EngineResult): AccessTier[] {
  const access = FAMILY_ACCESS[project.familyId];
  const starterResult = evaluateScale(project, 0.25);
  const stagedResult = evaluateScale(project, 0.65);
  const reclaimedHigh = money(Math.min(250, Math.max(75, result.cost.accessible.low * 0.04)));
  const starterLow = money(Math.max(50, result.cost.accessible.low * 0.06));
  const starterHigh = money(Math.max(starterLow, result.cost.accessible.high * 0.18));
  const stagedLow = money(Math.max(starterHigh, result.cost.accessible.low * 0.3));
  const stagedHigh = money(Math.max(stagedLow, result.cost.accessible.high * 0.65));
  return [
    {
      id: "existing",
      label: "Use what already exists",
      cost: { low: 0, high: 0 },
      costLabel: "$0 new equipment",
      service: access.existing,
      modeledOutput: "No purchased generation modeled; the benefit is avoided demand or direct service.",
      outputTruth: "unknown",
      requires: access.existingRequires,
      limitation: access.existingLimit,
      carriesForward: access.carry,
    },
    {
      id: "reclaimed",
      label: "Reclaimed or assisted entry",
      cost: { low: 0, high: reclaimedHigh },
      costLabel: `$0–$${reclaimedHigh.toLocaleString("en-US")} out of pocket`,
      service: access.reclaimed,
      modeledOutput: "Output remains unknown until the reused equipment is identified, tested, and measured.",
      outputTruth: "unknown",
      requires: access.reclaimedRequires,
      limitation: access.reclaimedLimit,
      carriesForward: access.carry,
    },
    {
      id: "starter",
      label: "One-service starter",
      cost: { low: starterLow, high: starterHigh },
      costLabel: `$${starterLow.toLocaleString("en-US")}–$${starterHigh.toLocaleString("en-US")} planning range`,
      service: access.starter,
      modeledOutput: `${output(starterResult)} under the starter-scale governed inputs; ${starterResult.feasibility.toLowerCase()} against the current priority load.`,
      outputTruth: "calculated",
      requires: access.starterRequires,
      limitation: `This scale is evaluated against the current ${result.targetMetric.value} ${result.targetMetric.unit} target and is not a whole-property promise.`,
      carriesForward: access.carry,
    },
    {
      id: "staged",
      label: "Expandable staged system",
      cost: { low: stagedLow, high: stagedHigh },
      costLabel: `$${stagedLow.toLocaleString("en-US")}–$${stagedHigh.toLocaleString("en-US")} planning range`,
      service: "Install a coherent portion of the governed architecture with protected interfaces sized so later capacity can be added deliberately.",
      modeledOutput: `${output(stagedResult)} under the staged governed inputs; ${stagedResult.feasibility.toLowerCase()} against the current priority load.`,
      outputTruth: "calculated",
      requires: ["Verified site measurements", "A complete protection and isolation plan", "Compatible equipment with documented expansion limits"],
      limitation: "Future expansion is only preserved when conductors, pipes, controls, foundations, storage interfaces, and permits account for it.",
      carriesForward: "The measurement record, protected routes, controls, compatible equipment, and commissioning baseline become part of the complete system.",
    },
    {
      id: "complete",
      label: "Complete reference system",
      cost: result.cost.accessible,
      costLabel: `$${result.cost.accessible.low.toLocaleString("en-US")}–$${result.cost.accessible.high.toLocaleString("en-US")} accessible planning range`,
      service: "Implement the complete source-to-load architecture represented by the current canonical EnergyCircle revision.",
      modeledOutput: `${output(result)}; ${result.feasibility.toLowerCase()} against the current defined target.`,
      outputTruth: result.productionMetric.truth,
      requires: ["Resolved unknowns and exclusion criteria", "Current local quotes and equipment data", "Required permits, inspections, and professional review"],
      limitation: "The modeled result remains a planning result until site measurements and selected equipment replace assumptions.",
      carriesForward: "The complete revision becomes the commissioning baseline and maintenance record.",
    },
  ];
}

const ASSEMBLY_TEMPLATES: Record<EnergyComponent["kind"], Array<Omit<AssemblyPart, "number">>> = {
  source: [
    { name: "Resource interface", function: "Receives the available property resource at the component boundary", interface: "Site resource to capture element", inspection: "Verify measured resource, obstruction, contamination, and access", failureEffect: "Available input falls below the governed assumption" },
    { name: "Capture element", function: "Converts the raw property resource into the component's usable input", interface: "Resource interface to collection or drive surface", inspection: "Check rating, active area, wear, fouling, alignment, and condition", failureEffect: "Production derates or becomes intermittent" },
    { name: "Mounting and support", function: "Maintains geometry, alignment, and environmental resistance", interface: "Component body to roof, tower, ground, waterway, or frame", inspection: "Verify loads, fasteners, foundations, corrosion, drainage, and clearances", failureEffect: "Geometry changes, damage propagates, or the assembly becomes unsafe" },
    { name: "Isolation and protection", function: "Allows the source to be disconnected and contains abnormal operation", interface: "Source outlet to governed route", inspection: "Confirm accessible isolation, ratings, guards, screening, and labels", failureEffect: "A source fault can propagate into conversion or distribution" },
    { name: "Resource sensing", function: "Makes actual input and degradation observable", interface: "Measured point to controller or field log", inspection: "Calibrate or compare against a traceable field measurement", failureEffect: "The system operates on an unverified resource assumption" },
  ],
  conversion: [
    { name: "Primary converter", function: "Changes the incoming carrier into useful electrical, thermal, hydraulic, gas, or mechanical output", interface: "Source route to converted-output route", inspection: "Verify rating, operating curve, materials, rotation, temperature, pressure, or voltage", failureEffect: "Useful output falls or the complete path opens" },
    { name: "Coupling or transfer stage", function: "Transfers energy between the incoming route and primary converter", interface: "Pipe, shaft, conductors, exchanger surface, or gas train", inspection: "Check alignment, seals, torque, continuity, leakage, fouling, and loss", failureEffect: "Loss rises and upstream energy no longer reaches the converter" },
    { name: "Control stage", function: "Keeps the converter within defined operating limits", interface: "Sensors and commands to the converter", inspection: "Test setpoints, fail-safe behavior, alarms, and manual override", failureEffect: "Output becomes unavailable, unstable, or unsafe" },
    { name: "Protection stage", function: "Contains overcurrent, overspeed, overpressure, over-temperature, reverse flow, or other abnormal states", interface: "Converter to isolation and safe discharge path", inspection: "Test protective devices and document trip or relief settings", failureEffect: "A conversion fault can damage storage, routes, loads, or people" },
    { name: "Service enclosure", function: "Preserves environmental protection and safe maintenance access", interface: "Equipment internals to service zone", inspection: "Confirm ingress rating, ventilation, drainage, labeling, and working clearance", failureEffect: "Weather, heat, contamination, or inaccessible service accelerates failure" },
  ],
  storage: [
    { name: "Storage medium", function: "Holds electrical, thermal, hydraulic, gas, or gravitational potential for later use", interface: "Charge path to discharge path", inspection: "Verify usable capacity, condition, chemistry, temperature, pressure, water level, or state of charge", failureEffect: "Autonomy and available service time fall" },
    { name: "Containment structure", function: "Keeps the stored medium inside its safe physical boundary", interface: "Storage medium to foundation and environment", inspection: "Inspect leaks, deformation, corrosion, supports, drainage, ventilation, and secondary containment", failureEffect: "Stored energy or material is released outside the governed path" },
    { name: "Charge and recharge interface", function: "Accepts energy without exceeding storage limits", interface: "Conversion output to storage inlet", inspection: "Verify limits, check valves, charge control, thermal management, and isolation", failureEffect: "Storage cannot be replenished or is damaged during recharge" },
    { name: "Discharge and isolation interface", function: "Delivers stored energy and makes the store safe to service", interface: "Storage outlet to distribution route", inspection: "Test isolation, protection, emergency shutdown, and residual-energy procedure", failureEffect: "Loads lose service or stored energy remains hazardous during maintenance" },
    { name: "State monitoring", function: "Reports capacity, level, pressure, temperature, or state of charge", interface: "Storage measurement to controller and maintenance record", inspection: "Compare indicated state with an independent measurement", failureEffect: "Runtime and remaining capacity become uncertain" },
  ],
  load: [
    { name: "Service interface", function: "Receives the governed energy carrier at the intended useful task", interface: "Distribution route to load boundary", inspection: "Verify carrier, rating, connection, and intended service", failureEffect: "Useful service is not delivered even when supply exists" },
    { name: "Priority isolation", function: "Separates this load without disabling unrelated services", interface: "Branch route to load disconnect", inspection: "Confirm accessible, labeled isolation and safe residual-energy state", failureEffect: "Maintenance requires a wider shutdown or a load fault propagates" },
    { name: "Branch protection", function: "Limits abnormal current, pressure, temperature, speed, or flow at the load", interface: "Load inlet to protective device", inspection: "Verify device type, rating, test interval, and coordination", failureEffect: "A load-side fault damages upstream equipment or the service area" },
    { name: "Use-point control", function: "Matches delivered energy to actual demand", interface: "Operator or automatic command to the load", inspection: "Test operating range, stop state, priority behavior, and failure response", failureEffect: "Demand exceeds the modeled priority-load boundary" },
    { name: "Service and measurement point", function: "Provides safe inspection and confirms delivered useful output", interface: "Load output to field measurement", inspection: "Preserve clearance and record baseline demand and service output", failureEffect: "Performance degradation remains hidden" },
  ],
};

function buildAssemblies(project: ProjectModel): ExplodedAssembly[] {
  return Object.values(project.components).map((componentItem) => {
    const selectedVariant = COMPONENT_VARIANTS.find((item) => item.id === componentItem.variantId) ?? COMPONENT_VARIANTS[1];
    const parts = ASSEMBLY_TEMPLATES[componentItem.kind].map((part, index) => ({ ...part, number: String(index + 1).padStart(2, "0"), name: `${componentItem.label}: ${part.name}` }));
    return {
      componentId: componentItem.id,
      componentLabel: componentItem.label,
      componentKind: componentItem.kind,
      variantLabel: selectedVariant.label,
      serviceLife: selectedVariant.serviceLife,
      evidence: selectedVariant.evidence,
      boundary: selectedVariant.boundary,
      parts,
      assemblyOrder: ["Verify the site and route interface", "Install support and containment", "Set the primary equipment", "Connect transfer, isolation, and protection", "Connect controls and sensing", "Inspect before energizing or filling", "Commission under a bounded test condition"],
      serviceAccess: `Maintain unobstructed access to isolation, protection, sensing, and the primary ${componentItem.kind} assembly; selected-equipment instructions govern final clearance.`,
      isolationGate: `Prove the ${componentItem.label} is isolated from every connected carrier and residual energy is controlled before service.`,
    };
  });
}

function projection(annual: number, disruption: number, escalation: number, years: number) {
  let operating = 0;
  for (let year = 0; year < years; year += 1) operating += annual * (1 + escalation) ** year;
  const disruptionTotal = disruption * years;
  return { years, operating: money(operating), disruption: money(disruptionTotal), combined: money(operating + disruptionTotal) };
}

function buildCostOfInaction(project: ProjectModel, result: EngineResult): CostOfInaction {
  const annual = project.parameters.annualBaselineCost ?? 0;
  const disruption = project.parameters.annualDisruptionCost ?? 0;
  const years = project.parameters.inactionYears ?? 5;
  const escalationPercent = project.parameters.annualEscalationPercent ?? 3;
  const horizons = [...new Set([1, years, 10])].sort((a, b) => a - b);
  const projections = horizons.map((horizon) => projection(annual, disruption, escalationPercent / 100, horizon));
  const selected = projection(annual, disruption, escalationPercent / 100, years);
  const comparison = selected.combined - result.cost.accessible.low;
  return {
    annualBaselineCost: annual,
    annualDisruptionCost: disruption,
    annualEscalationPercent: escalationPercent,
    horizonYears: years,
    cumulativeOperatingCost: selected.operating,
    cumulativeDisruptionExposure: selected.disruption,
    combinedExposure: selected.combined,
    comparisonToAccessibleLow: money(comparison),
    projections,
    truth: "estimated",
    basis: "User-editable annual operating or utility expense plus annual disruption exposure, with a visible reference escalation assumption. This is an exposure scenario, not a savings guarantee.",
    notMonetized: ["Financing and opportunity cost", "Equipment replacement and maintenance", "Changes in property use or demand", "Unpriced safety, environmental, comfort, productivity, and resilience effects", ...result.unknowns.map((item) => item.label)],
    interpretation: comparison >= 0
      ? `The selected ${years}-year exposure is $${money(comparison).toLocaleString("en-US")} above the low accessible planning boundary. That comparison does not prove the system pays back because measured performance, maintenance, financing, and actual quotes remain unresolved.`
      : `The selected ${years}-year exposure is $${money(Math.abs(comparison)).toLocaleString("en-US")} below the low accessible planning boundary. Cost alone does not determine whether the project should proceed.`,
  };
}

const FAMILY_RESOURCE: Record<EnergyFamilyId, PropertyResourceId | "gravity" | "hybrid"> = {
  "solar-pv": "solar", "solar-thermal": "solar", wind: "wind", "flow-power": "waterFlow",
  bioenergy: "biomass", "thermal-recovery": "wasteHeat", "mechanical-human": "humanMotion",
  "gravity-storage": "gravity", "coordinated-hybrid": "hybrid",
};

const OBJECTIVE_FIT: Record<ProjectModel["property"]["objective"], EnergyFamilyId[]> = {
  "reduce-cost": ["solar-pv", "solar-thermal", "flow-power", "thermal-recovery"],
  backup: ["solar-pv", "wind", "mechanical-human", "gravity-storage", "coordinated-hybrid"],
  "water-service": ["wind", "flow-power", "gravity-storage", "coordinated-hybrid"],
  "use-waste": ["bioenergy", "thermal-recovery", "coordinated-hybrid"],
  independence: ["solar-pv", "wind", "flow-power", "gravity-storage", "coordinated-hybrid"],
};

function matchResourceLevel(project: ProjectModel, familyId: EnergyFamilyId) {
  const resource = FAMILY_RESOURCE[familyId];
  const r = project.property.resources;
  if (resource === "gravity") return Math.min(r.waterStorage, r.elevation);
  if (resource === "hybrid") return Math.max(r.solar, r.wind, r.waterFlow, Math.min(r.waterStorage, r.elevation));
  return r[resource];
}

function buildFamilyMatches(project: ProjectModel): FamilyMatch[] {
  const budgetCeiling = { existing: 0, starter: 5000, staged: 20000, complete: Number.POSITIVE_INFINITY }[project.property.budgetBand];
  return ENERGY_FAMILIES.map((family) => {
    const reference = createReferenceProject(family.id, project.revision, project.property);
    const result = evaluateProject(reference);
    const resourceLevel = matchResourceLevel(project, family.id);
    const resourceScore = [0, 35, 60][resourceLevel];
    const objectiveScore = OBJECTIVE_FIT[project.property.objective].includes(family.id) ? 25 : 8;
    const costScore = budgetCeiling === 0 ? 8 : result.cost.accessible.low <= budgetCeiling ? 15 : 4;
    const diversityBonus = family.id === "coordinated-hybrid" && Object.values(project.property.resources).filter((level) => level > 0).length >= 3 ? 8 : 0;
    const score = Math.min(100, resourceScore + objectiveScore + costScore + diversityBonus);
    const status = resourceLevel === 0 ? "MEASURE FIRST" : score >= 75 ? "STRONG MATCH" : "POSSIBLE";
    const resourceText = resourceLevel === 2 ? "The governing resource is marked available" : resourceLevel === 1 ? "The governing resource is possible but unmeasured" : "The governing resource has not been identified";
    return {
      familyId: family.id,
      name: family.name,
      score,
      status,
      resourceLevel: resourceLevel === 2 ? "available" : resourceLevel === 1 ? "possible" : "not identified",
      reason: `${resourceText}; ${OBJECTIVE_FIT[project.property.objective].includes(family.id) ? "it aligns with the selected objective" : "it is a secondary objective fit"}; ${result.cost.accessible.low <= budgetCeiling || budgetCeiling === Number.POSITIVE_INFINITY ? "the complete reference enters the selected budget band" : "begin with its access path rather than the complete reference"}.`,
      firstMeasurement: result.nextMeasurement,
      referenceVerdict: result.feasibility,
    } as FamilyMatch;
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function buildFieldSequence(project: ProjectModel): FieldPhase[] {
  const notes = FAMILY_FIELD_NOTES[project.familyId];
  return [
    { number: "01", title: "Measure the property", purpose: notes.measure, checks: ["Replace assumed inputs with site measurements", "Record season, method, units, and uncertainty"] },
    { number: "02", title: "Lay out the complete path", purpose: notes.site, checks: ["Walk every route before procurement", "Identify isolation, overflow, drainage, and safe access"] },
    { number: "03", title: "Verify before purchase", purpose: "Resolve the unknowns and exclusion criteria shown in this revision before treating the budget as actionable.", checks: ["Obtain local equipment and labor quotes", "Check permits, codes, rights, setbacks, and professional-review triggers"], boundary: notes.boundary },
    { number: "04", title: "Build in testable stages", purpose: "Install source, conversion, storage, distribution, loads, recharge, and protection as independently testable assemblies.", checks: ["Document installed ratings and deviations", "Do not conceal routes or connections before inspection and testing"] },
    { number: "05", title: "Commission the system", purpose: notes.commission, checks: ["Record baseline output and loss measurements", "Test safe shutdown and the modeled failure condition"] },
    { number: "06", title: "Operate and maintain", purpose: notes.maintain, checks: ["Keep an inspection and performance log", "Recalculate after load, resource, storage, or route changes"] },
  ];
}

function exclusions(result: EngineResult) {
  const items = result.unknowns.map((unknown) => `${unknown.label} remains unknown.`);
  if (result.feasibility === "INFEASIBLE") items.unshift("The current governed revision does not serve the defined load.");
  if (result.feasibility === "FRAGILE") items.unshift("At least one defined output or autonomy threshold is not met.");
  items.push("The planning budget is not a supplier or installer quote.");
  items.push("Permitting, structural, environmental, electrical, hydraulic, fire, and safety review remain outside this model.");
  return items;
}

export function deriveEngineeringPackage(project: ProjectModel, result = evaluateProject(project)): EngineeringPackage {
  const scenario = FAMILY_SCENARIOS[project.familyId];
  const record = { project, result, scenario: { title: scenario.title, routes: scenario.routes } };
  return {
    projectId: project.id,
    revision: project.revision,
    fingerprint: fingerprint(record),
    generatedFrom: `Canonical project revision ${project.revision}`,
    invariant: result.feasibility === "VIABLE"
      ? `Protect the complete ${scenario.flowKinds.map((kind) => kind.label.toLowerCase()).join(" and ")} while preserving the measured resource and defined priority load.`
      : `Do not advance this revision until ${result.limitingFactor.toLowerCase()}`,
    exclusionCriteria: exclusions(result),
    componentSchedule: buildSchedule(project),
    budget: buildBudget(project, result),
    resilience: buildResilience(project, result),
    accessPath: buildAccessPath(project, result),
    assemblies: buildAssemblies(project),
    costOfInaction: buildCostOfInaction(project, result),
    familyMatches: buildFamilyMatches(project),
    fieldSequence: buildFieldSequence(project),
    record,
  };
}
