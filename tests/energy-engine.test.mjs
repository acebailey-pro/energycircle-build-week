import assert from "node:assert/strict";
import test from "node:test";

import {
  beginPreview,
  commitPreview,
  commitMutation,
  evaluateProject,
  referenceProject,
  updatePreview,
} from "../app/lib/energy-engine.ts";

test("the reference scenario begins fragile and exposes the storage constraint", () => {
  const result = evaluateProject(referenceProject);

  assert.equal(result.feasibility, "FRAGILE");
  assert.ok(
    result.warnings.some((warning) => warning.id === "storage-shortfall"),
  );
  assert.ok(Number(result.storedEnergy.value) < Number(result.requiredEnergy.value));
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
  assert.ok(Number(result.storedEnergy.value) >= Number(result.requiredEnergy.value));
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
  assert.equal(result.generatedPower.value, 0);
  assert.ok(result.warnings.some((warning) => warning.id === "intake-blocked"));
});
