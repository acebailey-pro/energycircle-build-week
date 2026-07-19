import type { EnergyFamilyId } from "./architecture-catalog.ts";
import {
  commitMutation,
  evaluateProject,
  FAMILY_SCENARIOS,
  type EnergyComponent,
  type EngineResult,
  type Feasibility,
  type ProjectModel,
  type TruthState,
} from "./family-engine.ts";

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
  const weights = components.map((component) => component.kind === "conversion" ? 1.2 : component.kind === "storage" ? 1.35 : 1);
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
      basis: "Allocated planning allowance; verify equipment and local labor before a decision.",
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
    fieldSequence: buildFieldSequence(project),
    record,
  };
}
