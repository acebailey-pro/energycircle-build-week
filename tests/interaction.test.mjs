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
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
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
  const [componentBox, propertyBox] = await Promise.all([
    component.boundingBox(),
    property.boundingBox(),
  ]);
  assert.ok(componentBox);
  assert.ok(propertyBox);

  const startX = componentBox.x + componentBox.width / 2;
  const startY = componentBox.y + componentBox.height / 2;
  const endX = destinationX === undefined
    ? startX
    : propertyBox.x + propertyBox.width * destinationX;
  const endY = propertyBox.y + propertyBox.height * destinationY;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();
}

test(
  "both live family models update every governed representation",
  { skip: !executablePath },
  async () => {
    let server;
    if (!(await isReady())) {
      server = spawn(
        process.execPath,
        ["./node_modules/vinext/dist/cli.js", "dev"],
        {
          cwd: new URL("..", import.meta.url),
          stdio: "ignore",
          windowsHide: true,
        },
      );
      await waitForServer();
    }

    const browser = await chromium.launch({
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
      await page.goto(baseUrl, { waitUntil: "networkidle" });

      assert.equal(await page.locator(".family-card").count(), 9);
      assert.equal(await page.locator(".family-card.is-live").count(), 2);
      assert.equal(await page.locator(".family-card.is-active-model").count(), 1);
      assert.equal(
        await page.locator(".family-card:not(.is-live)").count(),
        7,
      );

      await page.getByRole("button", { name: /Wind/i }).click();
      assert.match(
        (await page.locator(".family-focus").textContent()) ?? "",
        /Wind energy/i,
      );
      assert.match(
        (await page.locator(".topbar__context").textContent()) ?? "",
        /Revision 1/,
      );
      assert.equal(
        await page.getByRole("heading", { name: "Hillside Water Storage" }).count(),
        1,
      );

      assert.equal(await page.locator(".physical-object--tank").count(), 1);
      assert.match(
        (await page.locator(".component__start").textContent()) ?? "",
        /Drag the tank uphill/i,
      );
      assert.equal(await page.locator(".verdict strong").textContent(), "FRAGILE");

      await dragComponent(
        page,
        /Upper reservoir\. Drag to reposition/,
        0.18,
      );

      assert.equal(await page.locator(".verdict strong").textContent(), "VIABLE");
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /fragile to viable/i,
      );

      await page.getByRole("switch", { name: "Simulate intake obstruction" }).click();
      assert.equal(await page.locator(".verdict strong").textContent(), "INFEASIBLE");
      assert.ok(await page.locator(".route--blocked").count() > 0);
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /generation falls to zero/i,
      );

      await page.getByRole("button", { name: /Solar PV/i }).click();
      await page.getByRole("heading", { name: "Solar + Battery Home" }).waitFor();
      await page.waitForTimeout(700);
      assert.equal(await page.locator(".physical-object--battery").count(), 1);
      assert.equal(await page.locator(".physical-object--tank").count(), 0);
      assert.equal(await page.locator(".property__shade-zone").count(), 1);
      assert.equal(await page.locator(".verdict strong").textContent(), "FRAGILE");
      assert.match(
        (await page.locator(".component__start").textContent()) ?? "",
        /Drag the array into sun/i,
      );
      assert.equal(
        await page.getByRole("slider", { name: "Solar array capacity in kilowatts" }).count(),
        1,
      );
      assert.equal(
        await page.getByRole("slider", { name: "Battery capacity in kilowatt hours" }).count(),
        1,
      );

      await dragComponent(
        page,
        /Roof or ground array\. Drag to reposition/,
        0.2,
        0.37,
      );

      assert.equal(await page.locator(".verdict strong").textContent(), "VIABLE");
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /fragile to viable/i,
      );
      assert.match(
        (await page.locator(".metrics-grid").textContent()) ?? "",
        /Daily harvest/i,
      );
      assert.equal(await page.locator(".component__start").count(), 0);

      const property = page.locator(".property");
      await page.getByRole("button", { name: "system" }).click();
      assert.equal(await property.getAttribute("data-view"), "system");
      await page.getByRole("button", { name: "blueprint" }).click();
      assert.equal(await property.getAttribute("data-view"), "blueprint");

      await page.getByRole("switch", { name: "Simulate inverter outage" }).click();
      assert.equal(await page.locator(".verdict strong").textContent(), "INFEASIBLE");
      assert.ok(await page.locator(".route--blocked").count() > 0);
      assert.match(
        (await page.locator(".insight p").textContent()) ?? "",
        /production falls to zero/i,
      );

      await page.getByRole("button", { name: /Gravity storage/i }).click();
      await page.getByRole("heading", { name: "Hillside Water Storage" }).waitFor();
      assert.equal(await page.locator(".physical-object--tank").count(), 1);
      assert.equal(await page.locator(".physical-object--battery").count(), 0);
    } finally {
      await browser.close();
      if (server) server.kill();
    }
  },
);
