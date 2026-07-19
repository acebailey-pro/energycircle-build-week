export type TruthState =
  | "measured"
  | "assumed"
  | "calculated"
  | "estimated"
  | "unknown";

export type Feasibility = "VIABLE" | "FRAGILE" | "INFEASIBLE";
export type LiveFamilyId = "gravity-storage" | "solar-pv";
export type ComponentId =
  | "solar"
  | "pump"
  | "upperReservoir"
  | "turbine"
  | "inverter"
  | "battery"
  | "home"
  | "lowerReservoir";

export interface Point {
  x: number;
  y: number;
}

export interface EnergyComponent {
  id: ComponentId;
  label: string;
  kind: "source" | "storage" | "conversion" | "load";
  position: Point;
}

export interface ProjectParameters {
  criticalLoadKw: number;
  autonomyHours: number;
  reservoirVolumeM3?: number;
  pipeDiameterM?: number;
  designFlowM3s?: number;
  turbineEfficiency?: number;
  generatorEfficiency?: number;
  frictionFactor?: number;
  minorLossCoefficient?: number;
  solarArrayKw?: number;
  peakSunHours?: number;
  solarDerate?: number;
  batteryCapacityKwh?: number;
  batteryUsableFraction?: number;
  inverterEfficiency?: number;
}

export interface ProjectModel {
  id: string;
  name: string;
  familyId: LiveFamilyId;
  revision: number;
  components: Partial<Record<ComponentId, EnergyComponent>>;
  parameters: ProjectParameters;
  failures: {
    intakeBlocked: boolean;
    inverterOffline: boolean;
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
}

export type DomainMutation =
  | { type: "move-component"; id: ComponentId; position: Point }
  | { type: "set-pipe-diameter"; valueM: number }
  | { type: "set-reservoir-volume"; valueM3: number }
  | { type: "set-solar-array-capacity"; valueKw: number }
  | { type: "set-battery-capacity"; valueKwh: number }
  | { type: "set-critical-load"; valueKw: number }
  | { type: "set-autonomy-hours"; valueHours: number }
  | { type: "set-intake-blocked"; blocked: boolean }
  | { type: "set-inverter-offline"; offline: boolean };

export interface PreviewTransaction {
  base: ProjectModel;
  draft: ProjectModel;
  mutation: DomainMutation;
}

const gravityComponents: ProjectModel["components"] = {
  solar: {
    id: "solar",
    label: "Solar array",
    kind: "source",
    position: { x: 17, y: 67 },
  },
  pump: {
    id: "pump",
    label: "Transfer pump",
    kind: "conversion",
    position: { x: 34, y: 63 },
  },
  upperReservoir: {
    id: "upperReservoir",
    label: "Upper reservoir",
    kind: "storage",
    position: { x: 27, y: 30 },
  },
  turbine: {
    id: "turbine",
    label: "Micro turbine",
    kind: "conversion",
    position: { x: 55, y: 61 },
  },
  inverter: {
    id: "inverter",
    label: "Inverter",
    kind: "conversion",
    position: { x: 69, y: 47 },
  },
  home: {
    id: "home",
    label: "Critical loads",
    kind: "load",
    position: { x: 84, y: 37 },
  },
  lowerReservoir: {
    id: "lowerReservoir",
    label: "Lower reservoir",
    kind: "storage",
    position: { x: 79, y: 74 },
  },
};

const solarComponents: ProjectModel["components"] = {
  solar: {
    id: "solar",
    label: "Roof or ground array",
    kind: "source",
    position: { x: 17, y: 67 },
  },
  inverter: {
    id: "inverter",
    label: "Hybrid inverter",
    kind: "conversion",
    position: { x: 49, y: 55 },
  },
  battery: {
    id: "battery",
    label: "Battery storage",
    kind: "storage",
    position: { x: 67, y: 58 },
  },
  home: {
    id: "home",
    label: "Critical home loads",
    kind: "load",
    position: { x: 84, y: 37 },
  },
};

export const referenceProject: ProjectModel = {
  id: "reference-hillside-storage",
  name: "Hillside Water Storage",
  familyId: "gravity-storage",
  revision: 1,
  components: gravityComponents,
  parameters: {
    reservoirVolumeM3: 135,
    pipeDiameterM: 0.05,
    designFlowM3s: 0.004,
    turbineEfficiency: 0.8,
    generatorEfficiency: 0.9,
    frictionFactor: 0.024,
    minorLossCoefficient: 3.2,
    criticalLoadKw: 0.6,
    autonomyHours: 12,
  },
  failures: {
    intakeBlocked: false,
    inverterOffline: false,
  },
};

export const solarReferenceProject: ProjectModel = {
  id: "reference-solar-battery-home",
  name: "Solar + Battery Home",
  familyId: "solar-pv",
  revision: 1,
  components: solarComponents,
  parameters: {
    solarArrayKw: 2.6,
    peakSunHours: 4.6,
    solarDerate: 0.77,
    batteryCapacityKwh: 10,
    batteryUsableFraction: 0.85,
    inverterEfficiency: 0.92,
    criticalLoadKw: 0.6,
    autonomyHours: 12,
  },
  failures: {
    intakeBlocked: false,
    inverterOffline: false,
  },
};

const references: Record<LiveFamilyId, ProjectModel> = {
  "gravity-storage": referenceProject,
  "solar-pv": solarReferenceProject,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const terrainElevation = (point: Point) => 68 - point.y * 0.78 + point.x * 0.04;

const value = (
  label: string,
  amount: number | null,
  unit: string,
  truth: TruthState = "calculated",
): TruthValue => ({ label, value: amount, unit, truth });

const required = (project: ProjectModel, key: keyof ProjectParameters) => {
  const amount = project.parameters[key];
  if (typeof amount !== "number") {
    throw new Error(`Missing ${String(key)} for ${project.familyId}`);
  }
  return amount;
};

const component = (project: ProjectModel, id: ComponentId) => {
  const item = project.components[id];
  if (!item) throw new Error(`Missing component ${id} for ${project.familyId}`);
  return item;
};

export function createReferenceProject(
  familyId: LiveFamilyId,
  revision = 1,
): ProjectModel {
  const source = references[familyId];
  return {
    ...source,
    revision,
    components: Object.fromEntries(
      Object.entries(source.components).map(([id, item]) => [
        id,
        item
          ? { ...item, position: { ...item.position } }
          : item,
      ]),
    ),
    parameters: { ...source.parameters },
    failures: { ...source.failures },
  };
}

function evaluateGravity(project: ProjectModel): EngineResult {
  const upper = component(project, "upperReservoir").position;
  const lower = component(project, "lowerReservoir").position;
  const turbine = component(project, "turbine").position;
  const grossHead = Math.max(0, terrainElevation(upper) - terrainElevation(lower));
  const routeLength =
    (distance(upper, turbine) + distance(turbine, lower)) * 1.02;
  const diameter = required(project, "pipeDiameterM");
  const area = Math.PI * diameter ** 2 / 4;
  const flow = project.failures.intakeBlocked
    ? 0
    : required(project, "designFlowM3s");
  const velocity = area > 0 ? flow / area : 0;
  const velocityHead = velocity ** 2 / (2 * 9.81);
  const frictionLoss =
    required(project, "frictionFactor") * (routeLength / diameter) * velocityHead;
  const minorLoss = required(project, "minorLossCoefficient") * velocityHead;
  const headLoss = frictionLoss + minorLoss;
  const netHead = Math.max(0, grossHead - headLoss);
  const systemEfficiency =
    required(project, "turbineEfficiency") *
    required(project, "generatorEfficiency");
  const storedEnergy =
    (1000 *
      9.81 *
      required(project, "reservoirVolumeM3") *
      netHead *
      systemEfficiency) /
    3_600_000;
  const generatedPower =
    (1000 * 9.81 * flow * netHead * systemEfficiency) / 1000;
  const runtime =
    project.parameters.criticalLoadKw > 0
      ? storedEnergy / project.parameters.criticalLoadKw
      : 0;
  const requiredEnergy =
    project.parameters.criticalLoadKw * project.parameters.autonomyHours;
  const headLossPercent = grossHead > 0 ? (headLoss / grossHead) * 100 : 100;
  const warnings: EngineWarning[] = [];

  if (project.failures.intakeBlocked) {
    warnings.push({
      id: "intake-blocked",
      severity: "critical",
      title: "Water path interrupted",
      detail:
        "The simulated intake blockage reduces design flow and generated power to zero.",
    });
  }

  if (generatedPower < project.parameters.criticalLoadKw) {
    warnings.push({
      id: "power-shortfall",
      severity: generatedPower === 0 ? "critical" : "warning",
      title: "Generation below critical load",
      detail:
        "At the current head and flow, turbine output does not carry the defined critical load.",
    });
  }

  if (storedEnergy < requiredEnergy) {
    warnings.push({
      id: "storage-shortfall",
      severity: storedEnergy < requiredEnergy * 0.65 ? "critical" : "warning",
      title: "Autonomy target not met",
      detail:
        "Calculated stored energy is below the energy required for the defined autonomy window.",
    });
  }

  if (headLossPercent > 25) {
    warnings.push({
      id: "pipe-loss",
      severity: headLossPercent > 40 ? "critical" : "warning",
      title: "Pipe loss is consuming available head",
      detail:
        "The current diameter, flow, and route length consume a material share of gross head.",
    });
  }

  let feasibility: Feasibility = "VIABLE";
  if (
    project.failures.intakeBlocked ||
    netHead <= 0 ||
    generatedPower < project.parameters.criticalLoadKw * 0.5 ||
    storedEnergy < requiredEnergy * 0.65
  ) {
    feasibility = "INFEASIBLE";
  } else if (
    generatedPower < project.parameters.criticalLoadKw ||
    storedEnergy < requiredEnergy ||
    headLossPercent > 25
  ) {
    feasibility = "FRAGILE";
  }

  const resourceMetric = value("Net head", round(netHead), "m");
  const lossMetric = value(
    "Head consumed by losses",
    round(headLossPercent),
    "%",
  );
  const storageMetric = value("Stored energy", round(storedEnergy, 2), "kWh");
  const productionMetric = value("Generation", round(generatedPower, 2), "kW");
  const runtimeMetric = value("Critical-load runtime", round(runtime, 1), "h");
  const targetMetric = value("Autonomy target", round(requiredEnergy, 1), "kWh");

  return {
    projectRevision: project.revision,
    familyId: project.familyId,
    feasibility,
    resourceMetric,
    lossMetric,
    storageMetric,
    productionMetric,
    runtimeMetric,
    targetMetric,
    headlineMetrics: [resourceMetric, lossMetric, storageMetric, runtimeMetric],
    warnings,
    assumptions: [
      { label: "Terrain elevations", value: "Reference contour model", truth: "assumed" },
      { label: "Design flow", value: `${required(project, "designFlowM3s") * 1000} L/s`, truth: "assumed" },
      { label: "Combined conversion efficiency", value: `${round(systemEfficiency * 100, 0)}%`, truth: "assumed" },
    ],
    unknowns: [
      { label: "Geotechnical conditions", truth: "unknown" },
      { label: "Installed cost", truth: "unknown" },
      { label: "Permit requirements", truth: "unknown" },
    ],
  };
}

function evaluateSolar(project: ProjectModel): EngineResult {
  const arrayPosition = component(project, "solar").position;
  const verticalShade = Math.max(0, arrayPosition.y - 48) * 0.012;
  const groveShade = Math.max(0, 30 - arrayPosition.x) * 0.004;
  const shadeFactor = clamp(1 - verticalShade - groveShade, 0.5, 1);
  const shadeLossPercent = (1 - shadeFactor) * 100;
  const effectiveSunHours = required(project, "peakSunHours") * shadeFactor;
  const dailyHarvest = project.failures.inverterOffline
    ? 0
    : required(project, "solarArrayKw") *
      effectiveSunHours *
      required(project, "solarDerate");
  const usableBattery =
    required(project, "batteryCapacityKwh") *
    required(project, "batteryUsableFraction") *
    required(project, "inverterEfficiency");
  const peakAcOutput = project.failures.inverterOffline
    ? 0
    : required(project, "solarArrayKw") * required(project, "inverterEfficiency");
  const requiredEnergy =
    project.parameters.criticalLoadKw * project.parameters.autonomyHours;
  const runtime = usableBattery / project.parameters.criticalLoadKw;
  const warnings: EngineWarning[] = [];

  if (project.failures.inverterOffline) {
    warnings.push({
      id: "inverter-offline",
      severity: "critical",
      title: "Conversion path interrupted",
      detail:
        "The simulated inverter outage reduces usable AC production to zero while stored battery energy remains physically present.",
    });
  }

  if (dailyHarvest < requiredEnergy) {
    warnings.push({
      id: "solar-harvest-shortfall",
      severity: dailyHarvest < requiredEnergy * 0.65 ? "critical" : "warning",
      title: "Daily solar harvest below target",
      detail:
        "Modeled sunlight, placement, array capacity, and derating do not replenish the defined autonomy energy in one reference day.",
    });
  }

  if (usableBattery < requiredEnergy) {
    warnings.push({
      id: "battery-shortfall",
      severity: usableBattery < requiredEnergy * 0.65 ? "critical" : "warning",
      title: "Usable battery energy below target",
      detail:
        "Nominal battery capacity becomes smaller after the assumed usable fraction and inverter efficiency are applied.",
    });
  }

  if (shadeLossPercent > 20) {
    warnings.push({
      id: "array-shading",
      severity: shadeLossPercent > 38 ? "critical" : "warning",
      title: "Array placement reduces solar access",
      detail:
        "The array overlaps the modeled tree and terrain obstruction zone, reducing effective sun hours.",
    });
  }

  let feasibility: Feasibility = "VIABLE";
  if (
    project.failures.inverterOffline ||
    dailyHarvest < requiredEnergy * 0.65 ||
    usableBattery < requiredEnergy * 0.65 ||
    peakAcOutput < project.parameters.criticalLoadKw * 0.5
  ) {
    feasibility = "INFEASIBLE";
  } else if (
    dailyHarvest < requiredEnergy ||
    usableBattery < requiredEnergy ||
    peakAcOutput < project.parameters.criticalLoadKw ||
    shadeLossPercent > 25
  ) {
    feasibility = "FRAGILE";
  }

  const resourceMetric = value(
    "Effective sun",
    round(effectiveSunHours, 1),
    "h/day",
  );
  const lossMetric = value("Modeled shading", round(shadeLossPercent), "%");
  const storageMetric = value("Usable battery", round(usableBattery, 2), "kWh");
  const productionMetric = value("Daily harvest", round(dailyHarvest, 2), "kWh/day");
  const runtimeMetric = value("Critical-load runtime", round(runtime, 1), "h");
  const targetMetric = value("Daily energy target", round(requiredEnergy, 1), "kWh");

  return {
    projectRevision: project.revision,
    familyId: project.familyId,
    feasibility,
    resourceMetric,
    lossMetric,
    storageMetric,
    productionMetric,
    runtimeMetric,
    targetMetric,
    headlineMetrics: [resourceMetric, lossMetric, productionMetric, runtimeMetric],
    warnings,
    assumptions: [
      { label: "Peak sun resource", value: `${required(project, "peakSunHours")} h/day`, truth: "assumed" },
      { label: "System derating", value: `${round((1 - required(project, "solarDerate")) * 100, 0)}%`, truth: "assumed" },
      { label: "Usable battery fraction", value: `${round(required(project, "batteryUsableFraction") * 100, 0)}%`, truth: "assumed" },
    ],
    unknowns: [
      { label: "Measured roof shading", truth: "unknown" },
      { label: "Installed cost", truth: "unknown" },
      { label: "Interconnection requirements", truth: "unknown" },
    ],
  };
}

export function evaluateProject(project: ProjectModel): EngineResult {
  return project.familyId === "solar-pv"
    ? evaluateSolar(project)
    : evaluateGravity(project);
}

export function applyMutation(
  project: ProjectModel,
  mutation: DomainMutation,
): ProjectModel {
  switch (mutation.type) {
    case "move-component": {
      const current = project.components[mutation.id];
      if (!current) return project;
      return {
        ...project,
        components: {
          ...project.components,
          [mutation.id]: {
            ...current,
            position: {
              x: clamp(mutation.position.x, 4, 96),
              y: clamp(mutation.position.y, 8, 88),
            },
          },
        },
      };
    }
    case "set-pipe-diameter":
      if (project.familyId !== "gravity-storage") return project;
      return {
        ...project,
        parameters: {
          ...project.parameters,
          pipeDiameterM: clamp(mutation.valueM, 0.032, 0.11),
        },
      };
    case "set-reservoir-volume":
      if (project.familyId !== "gravity-storage") return project;
      return {
        ...project,
        parameters: {
          ...project.parameters,
          reservoirVolumeM3: clamp(mutation.valueM3, 20, 500),
        },
      };
    case "set-solar-array-capacity":
      if (project.familyId !== "solar-pv") return project;
      return {
        ...project,
        parameters: {
          ...project.parameters,
          solarArrayKw: clamp(mutation.valueKw, 0.4, 20),
        },
      };
    case "set-battery-capacity":
      if (project.familyId !== "solar-pv") return project;
      return {
        ...project,
        parameters: {
          ...project.parameters,
          batteryCapacityKwh: clamp(mutation.valueKwh, 1, 60),
        },
      };
    case "set-critical-load":
      return {
        ...project,
        parameters: {
          ...project.parameters,
          criticalLoadKw: clamp(mutation.valueKw, 0.1, 5),
        },
      };
    case "set-autonomy-hours":
      return {
        ...project,
        parameters: {
          ...project.parameters,
          autonomyHours: clamp(mutation.valueHours, 1, 72),
        },
      };
    case "set-intake-blocked":
      if (project.familyId !== "gravity-storage") return project;
      return {
        ...project,
        failures: { ...project.failures, intakeBlocked: mutation.blocked },
      };
    case "set-inverter-offline":
      if (project.familyId !== "solar-pv") return project;
      return {
        ...project,
        failures: { ...project.failures, inverterOffline: mutation.offline },
      };
  }
}

export function commitMutation(
  project: ProjectModel,
  mutation: DomainMutation,
): ProjectModel {
  const next = applyMutation(project, mutation);
  if (JSON.stringify(next) === JSON.stringify(project)) return project;
  return { ...next, revision: project.revision + 1 };
}

export function beginPreview(
  project: ProjectModel,
  mutation: DomainMutation,
): PreviewTransaction {
  return {
    base: project,
    draft: applyMutation(project, mutation),
    mutation,
  };
}

export function updatePreview(
  transaction: PreviewTransaction,
  mutation: DomainMutation,
): PreviewTransaction {
  return {
    ...transaction,
    draft: applyMutation(transaction.base, mutation),
    mutation,
  };
}

export function commitPreview(
  transaction: PreviewTransaction,
): ProjectModel {
  if (JSON.stringify(transaction.draft) === JSON.stringify(transaction.base)) {
    return transaction.base;
  }
  return {
    ...transaction.draft,
    revision: transaction.base.revision + 1,
  };
}

export function deriveCausalInsight(
  before: EngineResult,
  after: EngineResult,
): string {
  if (after.familyId === "solar-pv") {
    if (after.productionMetric.value === 0 && before.productionMetric.value !== 0) {
      return "Taking the inverter offline interrupts the AC conversion path, so usable daily production falls to zero.";
    }

    if (before.productionMetric.value === 0 && after.productionMetric.value !== 0) {
      return "Restoring the inverter reconnects the modeled array, battery, and critical-load path.";
    }

    if (before.feasibility !== after.feasibility) {
      return `This change moves the solar system from ${before.feasibility.toLowerCase()} to ${after.feasibility.toLowerCase()}: daily harvest is now ${String(after.productionMetric.value)} kWh against a ${String(after.targetMetric.value)} kWh target.`;
    }

    const shadeDelta =
      Number(after.lossMetric.value) - Number(before.lossMetric.value);
    if (Math.abs(shadeDelta) >= 2) {
      return `Array placement changed modeled shading by ${String(round(Math.abs(shadeDelta)))} percentage points; effective sun is now ${String(after.resourceMetric.value)} hours per day.`;
    }

    const productionDelta =
      Number(after.productionMetric.value) - Number(before.productionMetric.value);
    const direction = productionDelta >= 0 ? "increased" : "decreased";
    return `The change ${direction} modeled daily solar harvest by ${String(round(Math.abs(productionDelta), 2))} kWh.`;
  }

  if (after.productionMetric.value === 0 && before.productionMetric.value !== 0) {
    return "Blocking the intake interrupts flow, so generation falls to zero across the same project model.";
  }

  if (before.productionMetric.value === 0 && after.productionMetric.value !== 0) {
    return "Restoring the intake restores flow through the modeled water path and generation returns.";
  }

  if (before.feasibility !== after.feasibility) {
    return `This change moves the system from ${before.feasibility.toLowerCase()} to ${after.feasibility.toLowerCase()}: usable storage is now ${String(after.storageMetric.value)} kWh against a ${String(after.targetMetric.value)} kWh autonomy target.`;
  }

  const lossDelta =
    Number(after.lossMetric.value) - Number(before.lossMetric.value);
  if (Math.abs(lossDelta) >= 3) {
    return `Route and pipe geometry changed hydraulic loss by ${String(round(Math.abs(lossDelta)))} percentage points; losses now consume ${String(after.lossMetric.value)}% of gross head.`;
  }

  const energyDelta =
    Number(after.storageMetric.value) - Number(before.storageMetric.value);
  const direction = energyDelta >= 0 ? "increased" : "decreased";
  return `The geometry change ${direction} modeled usable storage by ${String(round(Math.abs(energyDelta), 2))} kWh through its effect on net head.`;
}
