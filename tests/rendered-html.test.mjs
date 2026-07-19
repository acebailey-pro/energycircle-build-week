import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the EnergyCircle reference experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>EnergyCircle \| Interactive Property Energy Model<\/title>/i,
  );
  assert.match(html, /Hillside Water Storage/);
  assert.match(html, /Start with what your property already has\./);
  assert.match(html, /Nine systems\. One property truth\./);
  assert.match(html, /Solar PV/);
  assert.match(html, /Gravity storage/);
  assert.match(html, />Hybrid</);
  assert.match(html, /Active system/);
  assert.match(html, /Structured property brief/);
  assert.match(html, /STRONG MATCH|POSSIBLE|MEASURE FIRST/);
  assert.doesNotMatch(html, /Catalogued/);
  assert.match(html, /System verdict/);
  assert.match(html, />property<\/button>/i);
  assert.match(html, /What this system can do/);
  assert.match(html, /The complete engineering package follows every change/);
  assert.match(html, /Component schedule/);
  assert.match(html, /\$0 to complete/);
  assert.match(html, /Print \/ save PDF/);
  assert.match(html, /Pre-build field package/);
  assert.match(html, /Exploded assemblies/);
  assert.match(html, /Cost of inaction/);
  assert.match(html, /Replace component/);
  assert.match(html, /Revision record/);
  assert.match(html, /What this result knows/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("meaningful controls are wired through the governed engine", async () => {
  const [experience, engine, engineeringPackage] = await Promise.all([
    readFile(
      new URL("../app/components/EnergyCircleExperience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/lib/family-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/engineering-package.ts", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /evaluateProject\(renderedProject\)/);
  assert.match(experience, /beginPreview\(project, mutation\)/);
  assert.match(experience, /commitPreview\(transaction\)/);
  assert.match(experience, /deriveCausalInsight/);
  assert.match(experience, /role="switch"/);
  assert.match(engine, /projectRevision: p\.revision/);
  assert.match(engine, /truth: TruthState/);
  assert.match(engine, /CostEstimate/);
  assert.match(engine, /FAMILY_SCENARIOS/);
  assert.match(experience, /deriveEngineeringPackage\(renderedProject, result\)/);
  assert.match(engineeringPackage, /deriveEngineeringPackage/);
  assert.match(engineeringPackage, /scenarioResult/);
});

test("the recovered product catalog is complete and truthfully staged", async () => {
  const catalog = await readFile(
    new URL("../app/lib/architecture-catalog.ts", import.meta.url),
    "utf8",
  );

  const ids = [
    "solar-pv",
    "solar-thermal",
    "wind",
    "flow-power",
    "bioenergy",
    "thermal-recovery",
    "mechanical-human",
    "gravity-storage",
    "coordinated-hybrid",
  ];

  for (const id of ids) assert.match(catalog, new RegExp(`id: "${id}"`));
  assert.equal((catalog.match(/demonstration: "live",/g) ?? []).length, 9);
  assert.equal((catalog.match(/demonstration: "catalogued",/g) ?? []).length, 0);
});
