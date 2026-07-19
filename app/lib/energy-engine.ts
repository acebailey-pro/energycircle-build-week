export type TruthState =
  | "measured"
  | "assumed"
  | "calculated"
  | "estimated"
  | "unknown";

export type Feasibility = "VIABLE" | "FRAGILE" | "INFEASIBLE";
export type ComponentId =
  | "solar"
  | "pump"
  | "upperReservoir"
  | "turbine"
  | "inverter"
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

export interface ProjectModel {
  id: string;
  name: string;
  revision: number;
  components: Record<ComponentId, EnergyComponent>;
  parameters: {
    reservoirVolumeM3: number;
    pipeDiameterM: number;
    designFlowM3s: number;
    turbineEfficiency: number;
    generatorEfficiency: number;
    frictionFactor: number;
    minorLossCoefficient: number;
    criticalLoadKw: number;
    autonomyHours: number;
  };
  failures: {
    intakeBlocked: boolean;
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
  feasibility: Feasibility;
  grossHead: TruthValue;
  headLoss: TruthValue;
  netHead: TruthValue;
  routeLength: TruthValue;
  storedEnergy: TruthValue;
  generatedPower: TruthValue;
  runtime: TruthValue;
  requiredEnergy: TruthValue;
  headLossPercent: TruthValue;
  warnings: EngineWarning[];
  assumptions: Array<{ label: string; value: string; truth: TruthState }>;
  unknowns: Array<{ label: string; truth: "unknown" }>;
}

export type DomainMutation =
  | { type: "move-component"; id: ComponentId; position: Point }
  | { type: "set-pipe-diameter"; valueM: number }
  | { type: "set-reservoir-volume"; valueM3: number }
  | { type: "set-critical-load"; valueKw: number }
  | { type: "set-autonomy-hours"; valueHours: number }
  | { type: "set-intake-blocked"; blocked: boolean };

export interface PreviewTransaction {
  base: ProjectModel;
  draft: ProjectModel;
  mutation: DomainMutation;
}

const COMPONENTS: ProjectModel["components"] = {
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

export const referenceProject: ProjectModel = {
  id: "reference-hillside-storage",
  name: "Hillside Water Storage",
  revision: 1,
  components: COMPONENTS,
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
  },
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

export function evaluateProject(project: ProjectModel): EngineResult {
  const upper = project.components.upperReservoir.position;
  const lower = project.components.lowerReservoir.position;
  const turbine = project.components.turbine.position;
  const grossHead = Math.max(0, terrainElevation(upper) - terrainElevation(lower));
  const routeLength =
    (distance(upper, turbine) + distance(turbine, lower)) * 1.02;
  const diameter = project.parameters.pipeDiameterM;
  const area = Math.PI * diameter ** 2 / 4;
  const flow = project.failures.intakeBlocked
    ? 0
    : project.parameters.designFlowM3s;
  const velocity = area > 0 ? flow / area : 0;
  const velocityHead = velocity ** 2 / (2 * 9.81);
  const frictionLoss =
    project.parameters.frictionFactor * (routeLength / diameter) * velocityHead;
  const minorLoss = project.parameters.minorLossCoefficient * velocityHead;
  const headLoss = frictionLoss + minorLoss;
  const netHead = Math.max(0, grossHead - headLoss);
  const systemEfficiency =
    project.parameters.turbineEfficiency *
    project.parameters.generatorEfficiency;
  const storedEnergy =
    (1000 *
      9.81 *
      project.parameters.reservoirVolumeM3 *
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

  return {
    projectRevision: project.revision,
    feasibility,
    grossHead: value("Gross head", round(grossHead), "m"),
    headLoss: value("Hydraulic loss", round(headLoss), "m"),
    netHead: value("Net head", round(netHead), "m"),
    routeLength: value("Pipe route", round(routeLength), "m"),
    storedEnergy: value("Stored energy", round(storedEnergy, 2), "kWh"),
    generatedPower: value("Generation", round(generatedPower, 2), "kW"),
    runtime: value("Critical-load runtime", round(runtime, 1), "h"),
    requiredEnergy: value("Autonomy target", round(requiredEnergy, 1), "kWh"),
    headLossPercent: value(
      "Head consumed by losses",
      round(headLossPercent),
      "%",
    ),
    warnings,
    assumptions: [
      {
        label: "Terrain elevations",
        value: "Reference contour model",
        truth: "assumed",
      },
      {
        label: "Design flow",
        value: String(project.parameters.designFlowM3s * 1000) + " L/s",
        truth: "assumed",
      },
      {
        label: "Combined conversion efficiency",
        value: String(round(systemEfficiency * 100, 0)) + "%",
        truth: "assumed",
      },
    ],
    unknowns: [
      { label: "Geotechnical conditions", truth: "unknown" },
      { label: "Installed cost", truth: "unknown" },
      { label: "Permit requirements", truth: "unknown" },
    ],
  };
}

export function applyMutation(
  project: ProjectModel,
  mutation: DomainMutation,
): ProjectModel {
  switch (mutation.type) {
    case "move-component":
      return {
        ...project,
        components: {
          ...project.components,
          [mutation.id]: {
            ...project.components[mutation.id],
            position: {
              x: clamp(mutation.position.x, 4, 96),
              y: clamp(mutation.position.y, 8, 88),
            },
          },
        },
      };
    case "set-pipe-diameter":
      return {
        ...project,
        parameters: {
          ...project.parameters,
          pipeDiameterM: clamp(mutation.valueM, 0.032, 0.11),
        },
      };
    case "set-reservoir-volume":
      return {
        ...project,
        parameters: {
          ...project.parameters,
          reservoirVolumeM3: clamp(mutation.valueM3, 20, 500),
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
      return {
        ...project,
        failures: { ...project.failures, intakeBlocked: mutation.blocked },
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
  if (after.generatedPower.value === 0 && before.generatedPower.value !== 0) {
    return "Blocking the intake interrupts flow, so generation falls to zero across the same project model.";
  }

  if (before.generatedPower.value === 0 && after.generatedPower.value !== 0) {
    return "Restoring the intake restores flow through the modeled water path and generation returns.";
  }

  if (before.feasibility !== after.feasibility) {
    return (
      "This change moves the system from " +
      before.feasibility.toLowerCase() +
      " to " +
      after.feasibility.toLowerCase() +
      ": usable storage is now " +
      String(after.storedEnergy.value) +
      " kWh against a " +
      String(after.requiredEnergy.value) +
      " kWh autonomy target."
    );
  }

  const lossDelta =
    Number(after.headLossPercent.value) - Number(before.headLossPercent.value);
  if (Math.abs(lossDelta) >= 3) {
    return (
      "Route and pipe geometry changed hydraulic loss by " +
      String(round(Math.abs(lossDelta))) +
      " percentage points; losses now consume " +
      String(after.headLossPercent.value) +
      "% of gross head."
    );
  }

  const energyDelta =
    Number(after.storedEnergy.value) - Number(before.storedEnergy.value);
  const direction = energyDelta >= 0 ? "increased" : "decreased";
  return (
    "The geometry change " +
    direction +
    " modeled usable storage by " +
    String(round(Math.abs(energyDelta), 2)) +
    " kWh through its effect on net head."
  );
}
