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
    assert.equal(document.accessPath.length, 5, family.id);
    assert.equal(document.accessPath[0].cost.low, 0, family.id);
    assert.equal(document.accessPath[0].cost.high, 0, family.id);
    assert.equal(document.accessPath[0].outputTruth, "unknown", family.id);
    assert.equal(document.accessPath[2].outputTruth, "calculated", family.id);
    assert.equal(document.assemblies.length, Object.keys(project.components).length, family.id);
    assert.ok(document.assemblies.every((assembly) => assembly.parts.length === 5), family.id);
    assert.equal(document.costOfInaction.truth, "estimated", family.id);
    assert.ok(document.costOfInaction.projections.length >= 2, family.id);
    assert.equal(document.fieldSequence.length, 6, family.id);
    assert.ok(document.exclusionCriteria.length >= 2, family.id);
    assert.deepEqual(document.record.project, project, family.id);
  }
});

test("component replacement changes canonical performance, cost, assemblies, and record", () => {
  const standard = createReferenceProject("solar-pv");
  const reclaimed = commitMutation(standard, { type: "select-component-variant", id: "solar", variantId: "reclaimed" });
  const highDuty = commitMutation(standard, { type: "select-component-variant", id: "solar", variantId: "high-duty" });
  const standardResult = evaluateProject(standard);
  const reclaimedDocument = deriveEngineeringPackage(reclaimed);
  const highDutyDocument = deriveEngineeringPackage(highDuty);

  assert.equal(reclaimed.revision, standard.revision + 1);
  assert.equal(reclaimed.components.solar.variantId, "reclaimed");
  assert.ok(reclaimedDocument.record.result.productionMetric.value < standardResult.productionMetric.value);
  assert.ok(reclaimedDocument.record.result.cost.accessible.low < standardResult.cost.accessible.low);
  assert.ok(highDutyDocument.record.result.productionMetric.value > standardResult.productionMetric.value);
  assert.ok(highDutyDocument.record.result.cost.accessible.low > standardResult.cost.accessible.low);
  assert.equal(reclaimedDocument.assemblies.find((item) => item.componentId === "solar").variantLabel, "Verified reclaimed");
  assert.equal(reclaimedDocument.record.project.components.solar.variantId, "reclaimed");
});

test("cost of inaction uses governed editable assumptions without becoming a recommendation", () => {
  let project = createReferenceProject("gravity-storage");
  project = commitMutation(project, { type: "set-inaction-annual-cost", value: 2400 });
  project = commitMutation(project, { type: "set-inaction-disruption-cost", value: 600 });
  project = commitMutation(project, { type: "set-inaction-years", value: 10 });
  const exposure = deriveEngineeringPackage(project).costOfInaction;

  assert.equal(exposure.horizonYears, 10);
  assert.equal(exposure.annualBaselineCost, 2400);
  assert.equal(exposure.annualDisruptionCost, 600);
  assert.ok(exposure.combinedExposure > 30_000);
  assert.match(exposure.basis, /not a savings guarantee/i);
  assert.match(exposure.interpretation, /does not prove|does not determine/i);
});

test("access tiers preserve affordability without claiming free whole-property output", () => {
  for (const family of ENERGY_FAMILIES) {
    const document = deriveEngineeringPackage(createReferenceProject(family.id));
    const existing = document.accessPath[0];
    const complete = document.accessPath.at(-1);

    assert.match(existing.costLabel, /^\$0/);
    assert.match(existing.modeledOutput, /No purchased generation modeled/i);
    assert.ok(existing.limitation.length > 40, family.id);
    assert.ok(complete.cost.high > 0, family.id);
    assert.match(complete.modeledOutput, /against the current defined target/i);
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

test("the property brief governs resource feasibility and survives family changes", () => {
  const baseline = createReferenceProject("flow-power");
  const absent = evaluateProject(baseline);
  assert.equal(absent.productionMetric.value, 0);
  assert.equal(absent.feasibility, "INFEASIBLE");
  assert.ok(absent.warnings.some((warning) => /absent|unavailable/i.test(`${warning.title} ${warning.detail}`)));

  const possibleProject = commitMutation(baseline, {
    type: "set-property-resource",
    resource: "waterFlow",
    level: 1,
  });
  const possible = evaluateProject(possibleProject);
  assert.ok(possible.productionMetric.value > 0);
  assert.ok(possible.warnings.some((warning) => /provisional|possible rather than strong/i.test(`${warning.title} ${warning.detail}`)));

  const switched = createReferenceProject("solar-pv", 1, possibleProject.property);
  assert.deepEqual(switched.property, possibleProject.property);
});

test("property compatibility compares all nine families without choosing for the user", () => {
  let project = createReferenceProject("gravity-storage");
  project = commitMutation(project, { type: "set-property-objective", objective: "use-waste" });
  project = commitMutation(project, { type: "set-property-resource", resource: "wasteHeat", level: 2 });
  const matches = deriveEngineeringPackage(project).familyMatches;

  assert.equal(matches.length, 9);
  const recovery = matches.find((match) => match.familyId === "thermal-recovery");
  assert.ok(recovery);
  assert.equal(recovery.status, "STRONG MATCH");
  assert.ok(matches.slice(0, 3).some((match) => match.familyId === "thermal-recovery"));
  assert.ok(matches.every((match) => match.reason.length > 60 && match.firstMeasurement.length > 10));
});
