import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";

import { chromium } from "playwright-core";

const baseUrl = "http://localhost:5173";
const edgeCandidates = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const executablePath = edgeCandidates.find((candidate) => existsSync(candidate));

async function isReady() {
  try { return (await fetch(baseUrl)).ok; } catch { return false; }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("EnergyCircle development server did not become ready.");
}

async function dragComponent(page, name, destinationY, destinationX) {
  const component = page.getByRole("button", { name });
  const property = page.locator(".property");
  const [componentBox, propertyBox] = await Promise.all([component.boundingBox(), property.boundingBox()]);
  assert.ok(componentBox);
  assert.ok(propertyBox);
  const startX = componentBox.x + componentBox.width / 2;
  const startY = componentBox.y + componentBox.height / 2;
  const endX = destinationX === undefined ? startX : propertyBox.x + propertyBox.width * destinationX;
  const endY = propertyBox.y + propertyBox.height * destinationY;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();
}

test(
  "all nine families open complete governed systems",
  { skip: !executablePath, timeout: 120_000 },
  async () => {
    let server;
    if (!(await isReady())) {
      server = spawn(process.execPath, ["./node_modules/vinext/dist/cli.js", "dev"], {
        cwd: new URL("..", import.meta.url), stdio: "ignore", windowsHide: true,
      });
      await waitForServer();
    }

    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
      await page.goto(baseUrl, { waitUntil: "networkidle" });

      const systems = [
        ["Solar PV", "Solar + Battery Property", "solar-pv"],
        ["Solar heat", "Solar Heat + Thermal Storage", "solar-thermal"],
        ["Wind", "Wind Generation + Water Lifting", "wind"],
        ["Water & pressure", "Water Flow + Pressure Recovery", "flow-power"],
        ["Biomass & biogas", "Biomass + Biogas Conversion", "bioenergy"],
        ["Recovered heat", "Recovered Heat Loop", "thermal-recovery"],
        ["Mechanical", "Mechanical + Human Power", "mechanical-human"],
        ["Gravity storage", "Hillside Water Storage", "gravity-storage"],
        ["Hybrid", "Coordinated Property Hybrid", "coordinated-hybrid"],
      ];

      assert.equal(await page.locator(".family-card").count(), 9);
      assert.equal(await page.locator(".family-card.is-live").count(), 9);
      assert.equal(await page.getByText("Catalogued", { exact: true }).count(), 0);

      for (const [card, heading, familyId] of systems) {
        await page.getByRole("button", { name: new RegExp(`^${card}`) }).click();
        await page.getByRole("heading", { name: heading }).waitFor();
        assert.equal(await page.locator(".property").getAttribute("data-family"), familyId);
        assert.ok(await page.locator(".component").count() >= 4, familyId);
        assert.ok(await page.getByRole("slider").count() >= 3, familyId);
        assert.equal(await page.locator(".family-card.is-active-model").count(), 1);
        assert.match((await page.locator(".cost-card").textContent()) ?? "", /\$[\d,]+/);
        assert.equal(await page.locator(".component-schedule article").count(), await page.locator(".component").count(), familyId);

        await page.getByRole("tab", { name: "Budget" }).click();
        assert.ok(await page.locator(".budget-row").count() >= 6, familyId);
        await page.getByRole("tab", { name: "Resilience" }).click();
        assert.equal(await page.locator(".resilience-case").count(), 5, familyId);
        await page.getByRole("tab", { name: "Component schedule" }).click();

        const failure = page.getByRole("switch");
        await failure.click();
        assert.equal(await page.locator(".verdict strong").textContent(), "INFEASIBLE", familyId);
        assert.ok(await page.locator(".route--blocked").count() > 0, familyId);
        await failure.click();
      }

      await page.getByRole("button", { name: /^Gravity storage/ }).click();
      await page.getByRole("heading", { name: "Hillside Water Storage" }).waitFor();
      assert.equal(await page.locator(".verdict strong").textContent(), "FRAGILE");
      await dragComponent(page, /Upper reservoir\. Drag to reposition/, 0.1);
      assert.equal(await page.locator(".verdict strong").textContent(), "VIABLE");
      assert.match((await page.locator(".insight p").textContent()) ?? "", /fragile to viable/i);

      await page.getByRole("button", { name: /What might it cost/i }).click();
      assert.match((await page.locator(".question-answer").textContent()) ?? "", /Installed planning envelope/i);
      await page.getByRole("button", { name: "blueprint" }).click();
      assert.equal(await page.locator(".property").getAttribute("data-view"), "blueprint");
      await page.getByRole("tab", { name: "Field sequence" }).click();
      assert.equal(await page.locator(".field-sequence > li").count(), 6);
      await page.getByRole("tab", { name: "Revision record" }).click();
      assert.match((await page.locator(".revision-seal strong").textContent()) ?? "", /^EC-[0-9A-F]{8}$/);
    } finally {
      await browser.close();
      if (server) server.kill();
    }
  },
);
