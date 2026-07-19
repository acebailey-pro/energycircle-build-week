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
  assert.match(html, /A worked example\. Your property comes next\./);
  assert.match(html, /System verdict/);
  assert.match(html, />property<\/button>/i);
  assert.match(html, /What this system can do/);
  assert.match(html, /What this result knows/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("meaningful controls are wired through the governed engine", async () => {
  const [experience, engine] = await Promise.all([
    readFile(
      new URL("../app/components/EnergyCircleExperience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/lib/energy-engine.ts", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /evaluateProject\(renderedProject\)/);
  assert.match(experience, /beginPreview\(project, mutation\)/);
  assert.match(experience, /commitPreview\(transaction\)/);
  assert.match(experience, /deriveCausalInsight/);
  assert.match(experience, /role="switch"/);
  assert.match(engine, /projectRevision: project\.revision/);
  assert.match(engine, /truth: TruthState/);
});
