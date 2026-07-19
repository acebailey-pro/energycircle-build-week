import assert from "node:assert/strict";
import test from "node:test";

import {
  beginPreview,
  commitPreview,
  commitMutation,
  evaluateProject,
  createReferenceProject,
  FAMILY_SCENARIOS,
  referenceProject,
  solarReferenceProject,
  updatePreview,
} from "../app/lib/energy-engine.ts";
import { ENERGY_FAMILIES } from "../app/lib/architecture-catalog.ts";

test("the reference scenario begins fragile and exposes the storage constraint", () => {
  const result = evaluateProject(referenceProject);

  assert.equal(result.feasibility, "FRAGILE");
  assert.ok(
    result.warnings.some((warning) => warning.id === "storage-shortfall"),
  );
  assert.ok(Number(result.storageMetric.value) < Number(result.targetMetric.value));
});

test("preview calculations never mutate or revise canonical project truth", () => {
  const transaction = beginPreview(referenceProject, {
    type: "move-component",
    id: "upperReservoir",
    position: { x: 27, y: 24 },
  });
  const updated = updatePreview(transaction, {
    type: "move-component",
    id: "upperReservoir",
    position: { x: 27, y: 18 },
  });

  assert.equal(referenceProject.revision, 1);
  assert.equal(updated.base.revision, 1);
  assert.equal(updated.draft.revision, 1);
  assert.equal(referenceProject.components.upperReservoir.position.y, 30);
  assert.equal(updated.draft.components.upperReservoir.position.y, 18);
});

test("a governed preview commits exactly one revision and all results follow it", () => {
  const transaction = beginPreview(referenceProject, {
    type: "move-component",
    id: "upperReservoir",
    position: { x: 27, y: 18 },
  });
  const committed = commitPreview(transaction);
  const result = evaluateProject(committed);

  assert.equal(committed.revision, referenceProject.revision + 1);
  assert.equal(result.projectRevision, committed.revision);
  assert.equal(result.feasibility, "VIABLE");
  assert.ok(Number(result.storageMetric.value) >= Number(result.targetMetric.value));
});

test("a no-op preview does not create a project revision", () => {
  const current = referenceProject.components.upperReservoir.position;
  const transaction = beginPreview(referenceProject, {
    type: "move-component",
    id: "upperReservoir",
    position: current,
  });

  assert.equal(commitPreview(transaction), referenceProject);
});

test("a simulated intake blockage propagates through the governed engine", () => {
  const blocked = commitMutation(referenceProject, {
    type: "set-intake-blocked",
    blocked: true,
  });
  const result = evaluateProject(blocked);

  assert.equal(result.feasibility, "INFEASIBLE");
  assert.equal(result.productionMetric.value, 0);
  assert.ok(result.warnings.some((warning) => warning.id === "intake-blocked"));
});

test("the solar reference begins fragile because modeled shading limits harvest", () => {
  const result = evaluateProject(solarReferenceProject);

  assert.equal(result.familyId, "solar-pv");
  assert.equal(result.feasibility, "FRAGILE");
  assert.ok(
    result.warnings.some((warning) => warning.id === "solar-harvest-shortfall"),
  );
  assert.ok(result.warnings.some((warning) => warning.id === "array-shading"));
  assert.ok(
    Number(result.productionMetric.value) < Number(result.targetMetric.value),
  );
});

test("moving the solar array commits one revision and clears the modeled obstruction", () => {
  const transaction = beginPreview(solarReferenceProject, {
    type: "move-component",
    id: "solar",
    position: { x: 36, y: 22 },
  });
  const committed = commitPreview(transaction);
  const result = evaluateProject(committed);

  assert.equal(committed.revision, solarReferenceProject.revision + 1);
  assert.equal(result.projectRevision, committed.revision);
  assert.equal(result.feasibility, "VIABLE");
  assert.ok(Number(result.lossMetric.value) < 10);
  assert.ok(
    Number(result.productionMetric.value) >= Number(result.targetMetric.value),
  );
});

test("a simulated solar inverter outage propagates through the governed engine", () => {
  const offline = commitMutation(solarReferenceProject, {
    type: "set-inverter-offline",
    offline: true,
  });
  const result = evaluateProject(offline);

  assert.equal(result.feasibility, "INFEASIBLE");
  assert.equal(result.productionMetric.value, 0);
  assert.ok(result.warnings.some((warning) => warning.id === "inverter-offline"));
});

test("family-specific mutations cannot alter the wrong project model", () => {
  const unchanged = commitMutation(solarReferenceProject, {
    type: "set-pipe-diameter",
    valueM: 0.08,
  });

  assert.equal(unchanged, solarReferenceProject);
});

test("all nine families are governed, interactive, priced system models", () => {
  const destinations = {
    "solar-pv": { x: 40, y: 20 },
    "solar-thermal": { x: 42, y: 18 },
    wind: { x: 52, y: 18 },
    "flow-power": { x: 26, y: 14 },
    bioenergy: { x: 41, y: 61 },
    "thermal-recovery": { x: 23, y: 65 },
    "mechanical-human": { x: 46, y: 60 },
    "gravity-storage": { x: 27, y: 18 },
    "coordinated-hybrid": { x: 80, y: 42 },
  };

  assert.equal(ENERGY_FAMILIES.length, 9);
  for (const family of ENERGY_FAMILIES) {
    const model = createReferenceProject(family.id);
    const scenario = FAMILY_SCENARIOS[family.id];
    const before = evaluateProject(model);
    const changed = commitMutation(model, {
      type: "move-component",
      id: scenario.initialComponent,
      position: destinations[family.id],
    });
    const after = evaluateProject(changed);

    assert.ok(Object.keys(model.components).length >= 4, family.id);
    assert.ok(scenario.controls.length >= 3, family.id);
    assert.ok(scenario.routes.length >= 3, family.id);
    assert.equal(changed.revision, model.revision + 1, family.id);
    assert.equal(after.projectRevision, changed.revision, family.id);
    assert.ok(before.cost.accessible.low > 0, family.id);
    assert.ok(before.cost.installed.high > before.cost.accessible.low, family.id);
    assert.equal(before.cost.truth, "estimated", family.id);
    assert.ok(before.nextMeasurement.length > 20, family.id);
  }
});

test("every family propagates its defined failure through useful output", () => {
  for (const family of ENERGY_FAMILIES) {
    const model = createReferenceProject(family.id);
    const failed = commitMutation(model, {
      type: "set-active-failure",
      active: true,
    });
    const result = evaluateProject(failed);

    assert.equal(result.productionMetric.value, 0, family.id);
    assert.equal(result.feasibility, "INFEASIBLE", family.id);
    assert.ok(result.warnings.some((warning) => warning.severity === "critical"), family.id);
  }
});
