import assert from "node:assert/strict";
import test from "node:test";

import { ENERGY_FAMILIES } from "../app/lib/architecture-catalog.ts";
import { deriveEngineeringPackage } from "../app/lib/engineering-package.ts";
import { commitMutation, createReferenceProject, evaluateProject } from "../app/lib/energy-engine.ts";

test("every family produces a complete package from its canonical revision", () => {
  for (const family of ENERGY_FAMILIES) {
    const project = createReferenceProject(family.id);
    const result = evaluateProject(project);
    const document = deriveEngineeringPackage(project, result);

    assert.equal(document.revision, project.revision, family.id);
    assert.match(document.fingerprint, /^EC-[0-9A-F]{8}$/, family.id);
    assert.equal(document.componentSchedule.length, Object.keys(project.components).length, family.id);
    assert.equal(document.budget.length, Object.keys(project.components).length + 1, family.id);
    assert.equal(document.resilience.length, 5, family.id);
    assert.equal(document.fieldSequence.length, 6, family.id);
    assert.ok(document.exclusionCriteria.length >= 2, family.id);
    assert.deepEqual(document.record.project, project, family.id);
  }
});

test("stress scenarios are governed previews and do not revise project truth", () => {
  const project = createReferenceProject("coordinated-hybrid", 7);
  const document = deriveEngineeringPackage(project);

  assert.equal(project.revision, 7);
  assert.equal(document.revision, 7);
  assert.equal(document.resilience.at(-1).status, "INFEASIBLE");
  assert.match(document.resilience.at(-1).usefulOutput, /^0 /);
});

test("the record fingerprint changes with a governed project change", () => {
  const before = createReferenceProject("solar-pv");
  const after = commitMutation(before, { type: "set-solar-array-capacity", valueKw: 6 });

  assert.notEqual(deriveEngineeringPackage(before).fingerprint, deriveEngineeringPackage(after).fingerprint);
  assert.equal(after.revision, before.revision + 1);
});

test("budget lines remain explicit estimates inside the current planning envelope", () => {
  const project = createReferenceProject("gravity-storage");
  const result = evaluateProject(project);
  const document = deriveEngineeringPackage(project, result);

  for (const line of document.budget) {
    assert.equal(line.truth, "estimated");
    assert.ok(line.accessible.low >= 0);
    assert.ok(line.installed.high >= line.accessible.low);
    assert.match(line.basis, /planning allowance/i);
  }
});
